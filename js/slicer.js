/**
 * Inkflow Page Slicer
 * Horizontal page slicing with razor cursor, dotted cut preview,
 * per-slice share/save, and full undo support.
 */
document.addEventListener('DOMContentLoaded', () => {
  const ikf = window.inkflow;
  if (!ikf) { console.warn('Slicer: window.inkflow not available'); return; }

  /* ─── State ───────────────────────────────────────────── */
  let sliceMode   = false;
  const history   = [];          // snapshot stack for undo
  const handlerMap = new Map();  // sheet → {onMove, onLeave, onClick}

  /* ─── DOM refs ────────────────────────────────────────── */
  const btnSlice = document.getElementById('btn-slice-mode');
  const btnUndo  = document.getElementById('btn-undo-slice');
  if (!btnSlice) return;

  /* ─── Slice Preview Line (one per sheet, injected) ──── */
  function ensurePreview(sheet) {
    let el = sheet.querySelector('.slice-preview-line');
    if (!el) {
      el = document.createElement('div');
      el.className = 'slice-preview-line';
      el.innerHTML =
        `<span class="slice-preview-badge">` +
          `<i class="fa-solid fa-scissors"></i>` +
          `<span class="slice-badge-text">Click to slice</span>` +
        `</span>` +
        `<span class="slice-preview-ruler"></span>`;
      el.style.display = 'none';
      sheet.appendChild(el);
    }
    return el;
  }

  function removeAllPreviews() {
    document.querySelectorAll('.slice-preview-line').forEach(el => el.remove());
  }

  /* ─── Line snapping helpers ───────────────────────────── */
  function getLineHeight() {
    return parseInt(ikf.getState().lineHeight) || 40;
  }

  // Read actual paddingTop of a sheet element (fallback 40px)
  function getSheetPaddingTop(sheet) {
    if (!sheet) return 40;
    const pt = parseInt(window.getComputedStyle(sheet).paddingTop) || 40;
    return pt;
  }

  // Snap a raw Y (relative to sheet outer border-box top) to the nearest ruled-line grid
  function snappedY(rawY, sheet) {
    const lh  = getLineHeight();
    const top = getSheetPaddingTop(sheet);
    const idx = Math.round((rawY - top) / lh);
    return top + Math.max(0, idx) * lh;
  }

  // Convert a raw click Y to a text line index (1-based minimum)
  function lineIndexFromY(rawY, sheet) {
    const lh  = getLineHeight();
    const top = getSheetPaddingTop(sheet);
    return Math.max(1, Math.floor((rawY - top) / lh));
  }

  /* ─── Get all paper sheets ────────────────────────────── */
  function allSheets() {
    const main = ikf.getPaperSheet();
    const extras = [...document.querySelectorAll('.paper-sheet.extra-page')];
    return main ? [main, ...extras] : extras;
  }

  /* ─── Attach / detach hover+click on all sheets ────────── */
  function attachAll() {
    allSheets().forEach(sheet => {
      if (handlerMap.has(sheet)) return;

      const onMove = (e) => {
        if (!sliceMode) return;
        const rect = sheet.getBoundingClientRect();
        const rawY = e.clientY - rect.top;
        const sy   = snappedY(rawY, sheet);
        const prev = ensurePreview(sheet);
        prev.style.top     = sy + 'px';
        prev.style.display = 'flex';
        // Update line label with line number
        const lineNum = lineIndexFromY(rawY, sheet);
        const badge   = prev.querySelector('.slice-badge-text');
        if (badge) badge.textContent = `Slice at line ${lineNum}`;
      };

      const onLeave = () => {
        const prev = sheet.querySelector('.slice-preview-line');
        if (prev) prev.style.display = 'none';
      };

      const onClick = (e) => {
        if (!sliceMode) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = sheet.getBoundingClientRect();
        performSlice(sheet, e.clientY - rect.top);
      };

      sheet.addEventListener('mousemove',  onMove);
      sheet.addEventListener('mouseleave', onLeave);
      sheet.addEventListener('click',      onClick, { capture: true });
      handlerMap.set(sheet, { onMove, onLeave, onClick });
    });
  }

  function detachAll() {
    handlerMap.forEach(({ onMove, onLeave, onClick }, sheet) => {
      sheet.removeEventListener('mousemove',  onMove);
      sheet.removeEventListener('mouseleave', onLeave);
      sheet.removeEventListener('click',      onClick, { capture: true });
    });
    handlerMap.clear();
  }

  /* ─── Slice mode toggle ───────────────────────────────── */
  function activateSlice() {
    sliceMode = true;
    btnSlice.classList.add('active');
    btnSlice.querySelector('.slice-btn-label').textContent = 'Exit Slice Mode';
    document.body.classList.add('slice-mode');
    attachAll();
    showSliceHint(true);
  }

  function deactivateSlice() {
    sliceMode = false;
    btnSlice.classList.remove('active');
    btnSlice.querySelector('.slice-btn-label').textContent = 'Slice Page';
    document.body.classList.remove('slice-mode');
    removeAllPreviews();
    detachAll();
    showSliceHint(false);
  }

  btnSlice.addEventListener('click', () => {
    sliceMode ? deactivateSlice() : activateSlice();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sliceMode) deactivateSlice();
  });

  /* ─── Slice hint banner ───────────────────────────────── */
  function showSliceHint(show) {
    let hint = document.getElementById('slice-hint-banner');
    if (show) {
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'slice-hint-banner';
        hint.className = 'slice-hint-banner';
        hint.innerHTML =
          `<i class="fa-solid fa-scissors"></i>` +
          `<span><strong>Slice Mode Active</strong> — Hover any page to preview the cut line, then click to slice it into two pages. Press <kbd>Esc</kbd> to exit.</span>`;
        const workspace = ikf.getPaperWorkspace();
        if (workspace) {
          // Insert as first child of workspace so it appears above pages
          workspace.insertBefore(hint, workspace.firstChild);
        }
      }
    } else {
      if (hint) hint.remove();
    }
  }

  /* ─── Snapshot helpers ────────────────────────────────── */
  function captureSnapshot() {
    const state = ikf.getState();
    // Use state.extraPages text (markdown) which is the canonical source for extra pages
    const extras = (state.extraPages || []).map(p => p.text || '');
    return { page1: state.text, extras };
  }

  function restoreSnapshot(snap) {
    const state = ikf.getState();
    const txt   = ikf.getTxt();

    // Restore page 1
    state.text = snap.page1;
    if (txt) txt.value = snap.page1;
    ikf.render();

    // Remove all extra pages
    state.extraPages = [];
    document.querySelectorAll('.extra-page-block').forEach(el => el.remove());

    // Re-add extras in order
    let lastBlock = null;
    for (const text of snap.extras) {
      lastBlock = ikf.insertPageAfterBlock(lastBlock, text);
    }

    ikf.saveState();
    updateUndoBtn();

    // Re-attach slice listeners if still in slice mode
    if (sliceMode) setTimeout(attachAll, 100);
  }

  /* ─── Perform the actual slice ────────────────────────── */
  // Helper: get htmlToMarkdown and formatMarkdownToHTML from window.inkflow if exposed,
  // or fall back to innerText/textContent
  function getExtraPageText(block) {
    const state = ikf.getState();
    const allExtras = [...document.querySelectorAll('.extra-page-block')];
    const idx = allExtras.indexOf(block);
    if (idx >= 0 && state.extraPages && state.extraPages[idx]) {
      return state.extraPages[idx].text || '';
    }
    // Fallback: try innerText of contenteditable
    const co = block.querySelector('.paper-content-out');
    return co ? (co.innerText || '') : '';
  }

  function setExtraPageContent(block, text) {
    const state = ikf.getState();
    const allExtras = [...document.querySelectorAll('.extra-page-block')];
    const idx = allExtras.indexOf(block);
    if (idx >= 0 && state.extraPages && state.extraPages[idx]) {
      state.extraPages[idx].text = text;
    }
    const co = block.querySelector('.paper-content-out');
    if (co) {
      // Use formatMarkdownToHTML if available via inkflow API, else plain text
      if (typeof ikf.formatMarkdownToHTML === 'function') {
        co.innerHTML = ikf.formatMarkdownToHTML(text);
      } else {
        co.textContent = text;
      }
    }
  }

  function performSlice(sheet, clickY) {
    // Save undo snapshot BEFORE slicing
    history.push(captureSnapshot());
    updateUndoBtn();

    const lineIdx = lineIndexFromY(clickY, sheet);
    const state   = ikf.getState();
    const main    = ikf.getPaperSheet();
    const isMain  = sheet === main;

    let currentText, afterBlock;

    if (isMain) {
      // Page 1: canonical text from state.text (markdown)
      currentText = state.text;
      afterBlock  = null;
    } else {
      const block = sheet.closest('.extra-page-block');
      if (!block) return;
      afterBlock  = block;
      // Extra page: use state.extraPages text (markdown), not co.innerText
      currentText = getExtraPageText(block);
    }

    // Split text at line boundary
    const lines      = currentText.split('\n');
    const topText    = lines.slice(0, lineIdx).join('\n');
    const bottomText = lines.slice(lineIdx).join('\n');

    // Flash the cut line before slicing
    const prev = sheet.querySelector('.slice-preview-line');
    if (prev) {
      prev.classList.add('slice-cut-flash');
      setTimeout(() => prev.classList.remove('slice-cut-flash'), 500);
    }

    // Update top page content
    if (isMain) {
      state.text = topText;
      const txt = ikf.getTxt();
      if (txt) txt.value = topText;
      ikf.render();
    } else {
      const block = sheet.closest('.extra-page-block');
      setExtraPageContent(block, topText);
    }

    // Insert new bottom page after the sliced page (with 200ms delay for flash)
    setTimeout(() => {
      const newBlock = ikf.insertPageAfterBlock(afterBlock, bottomText);
      ikf.saveState();

      // Scroll to new page
      if (newBlock) {
        setTimeout(() => newBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }

      // Re-attach listeners to newly created sheet
      if (sliceMode) setTimeout(attachAll, 150);
    }, 200);
  }

  /* ─── Undo ────────────────────────────────────────────── */
  function updateUndoBtn() {
    if (!btnUndo) return;
    btnUndo.disabled = history.length === 0;
    btnUndo.title    = history.length > 0
      ? `Undo last slice (${history.length} available)`
      : 'No slices to undo';
    btnUndo.querySelector('.undo-count').textContent =
      history.length > 0 ? `(${history.length})` : '';
  }

  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      if (history.length === 0) return;
      restoreSnapshot(history.pop());
    });
  }

  /* ─── MutationObserver: re-attach on new pages ────────── */
  const ws = ikf.getPaperWorkspace();
  if (ws) {
    new MutationObserver(() => { if (sliceMode) attachAll(); })
      .observe(ws, { childList: true, subtree: false });
  }

  /* ─── Init ────────────────────────────────────────────── */
  updateUndoBtn();
});
