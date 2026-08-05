document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const txt = document.getElementById('editor-txt');
  const fontSelect = document.getElementById('editor-font');
  const sizeSlider = document.getElementById('editor-size');
  const sizeVal = document.getElementById('size-val');
  const lhSlider = document.getElementById('editor-lh');
  const lhVal = document.getElementById('lh-val');
  const lsSlider = document.getElementById('editor-ls');
  const lsVal = document.getElementById('ls-val');
  const wsSlider = document.getElementById('editor-ws');
  const wsVal = document.getElementById('ws-val');
  const ruledBox = document.getElementById('opt-ruled');
  const marginBox = document.getElementById('opt-margin');
  const btnBold = document.getElementById('btn-bold');
  const btnUnderline = document.getElementById('btn-underline');
  const bwSlider = document.getElementById('editor-bold-weight');
  const bwVal = document.getElementById('bw-val');
  const utSlider = document.getElementById('editor-underline-thick');
  const utVal = document.getElementById('ut-val');
  const customInk = document.getElementById('ink-custom');
  const paperSheet = document.getElementById('paper-sheet');
  const paperOut = document.getElementById('paper-out');
  const marginLine = document.getElementById('margin-line');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');
  const btnClear = document.getElementById('btn-clear');
  const btnPrint = document.getElementById('btn-print');
  const btnDownload = document.getElementById('btn-download');
  const btnShare = document.getElementById('btn-share');
  
  // Preset elements
  const presetPaperButtons = document.querySelectorAll('[data-paper]');
  const presetInkButtons = document.querySelectorAll('[data-ink]');
  const pageSelect = document.getElementById('active-page-select');
  let activePageIndex = 0; // 0-based index: 0 = Page 1, 1 = extraPages[0] (Page 2), etc.

  const today = new Date();
  const defaultDateStr = `Date: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  // Application State
  let state = {
    text: `${defaultDateStr}\n6x6 Tab Azicip 250mg\n1x10 Tab Cefix 200DT\n2x100gm Clocip Dusting Powder (Big)\n6x4 Cap Gemsoline DS 60K Cap`,
    font: "'Caveat', cursive",
    size: 28,
    lineHeight: 40,
    letterSpacing: 0,
    wordSpacing: 0,
    ruled: true,
    margin: true,
    boldWeight: 700,
    underlineThickness: 2,
    ink: '#1a2a6c', // Gel Blue default
    paperPreset: 'ruled', // classic lined default
    page1Height: null, // height in px if sliced
    page1Title: 'Page 1', // custom title for page 1
    extraPages: [] // array of { text: '', height: null, title: '', sheetId: '' }
  };

  // Load state from local storage if exists
  function loadSavedState() {
    const saved = localStorage.getItem('inkflow_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      } catch (e) {
        console.error("Error loading saved state", e);
      }
    }

    // Process URL search query parameters
    const urlParams = new URLSearchParams(window.location.search);

    // ?font= param (from Font Gallery)
    const fontParam = urlParams.get('font');
    if (fontParam) {
      state.font = decodeURIComponent(fontParam);
    }

    // ?note= param (from Saved Notes library — load a specific saved note)
    const noteId = urlParams.get('note');
    if (noteId) {
      try {
        const allNotes = JSON.parse(localStorage.getItem('inkflow_saved_notes') || '[]');
        const savedNote = allNotes.find(n => n.id === noteId);
        if (savedNote) {
          // Restore every field that was saved
          if (savedNote.text !== undefined)               state.text = savedNote.text;
          if (savedNote.font !== undefined)               state.font = savedNote.font;
          if (savedNote.size !== undefined)               state.size = savedNote.size;
          if (savedNote.lineHeight !== undefined)         state.lineHeight = savedNote.lineHeight;
          if (savedNote.letterSpacing !== undefined)      state.letterSpacing = savedNote.letterSpacing;
          if (savedNote.wordSpacing !== undefined)        state.wordSpacing = savedNote.wordSpacing;
          if (savedNote.ink !== undefined)                state.ink = savedNote.ink;
          if (savedNote.paperPreset !== undefined)        state.paperPreset = savedNote.paperPreset;
          if (savedNote.ruled !== undefined)              state.ruled = savedNote.ruled;
          if (savedNote.margin !== undefined)             state.margin = savedNote.margin;
          if (savedNote.boldWeight !== undefined)         state.boldWeight = savedNote.boldWeight;
          if (savedNote.underlineThickness !== undefined) state.underlineThickness = savedNote.underlineThickness;
          if (savedNote.page1Height !== undefined)        state.page1Height = savedNote.page1Height;
          if (savedNote.page1Title !== undefined)         state.page1Title = savedNote.page1Title;
          if (savedNote.extraPages !== undefined)         state.extraPages = savedNote.extraPages;
          // Strip the ?note= param from the URL so refreshing doesn't re-load old state
          history.replaceState(null, '', window.location.pathname);
        }
      } catch (e) {
        console.error('Error restoring saved note:', e);
      }
    }
  }

  // ── Sync extra page contents from DOM into state ─────────────
  function syncExtraPagesFromDOM() {
    const blocks = document.querySelectorAll('.extra-page-block');
    const updated = [];
    blocks.forEach((block, idx) => {
      const co = block.querySelector('.paper-content-out');
      const sheet = block.querySelector('.paper-sheet');
      const titleText = block.querySelector('.page-title-text');

      const existing = (state.extraPages && state.extraPages[idx]) ? state.extraPages[idx] : {};
      const text = co ? htmlToMarkdown(co.innerHTML) : (existing.text || '');
      const title = titleText ? titleText.textContent.trim() : (existing.title || `Page ${idx + 2}`);
      const sheetId = sheet ? (sheet.getAttribute('data-sheet-id') || existing.sheetId) : (existing.sheetId || ('sheet-' + Date.now()));
      const height = existing.height || null;

      updated.push({ text, title, sheetId, height });
    });
    state.extraPages = updated;
    return state.extraPages;
  }

  // Save current state to local storage
  function saveState() {
    syncExtraPagesFromDOM();
    localStorage.setItem('inkflow_state', JSON.stringify({
      text: state.text,
      font: state.font,
      size: state.size,
      lineHeight: state.lineHeight,
      letterSpacing: state.letterSpacing,
      wordSpacing: state.wordSpacing,
      ruled: state.ruled,
      margin: state.margin,
      boldWeight: state.boldWeight,
      underlineThickness: state.underlineThickness,
      ink: state.ink,
      paperPreset: state.paperPreset,
      page1Height: state.page1Height,
      page1Title: state.page1Title,
      extraPages: state.extraPages
    }));
  }

  // Update controls display to match state
  function updateControlsUI() {
    if (txt) txt.value = state.text;
    if (fontSelect) fontSelect.value = state.font;
    if (sizeSlider) {
      sizeSlider.value = state.size;
      sizeVal.textContent = state.size;
    }
    if (lhSlider) {
      lhSlider.value = state.lineHeight;
      lhVal.textContent = state.lineHeight;
    }
    if (lsSlider) {
      lsSlider.value = state.letterSpacing;
      lsVal.textContent = state.letterSpacing;
    }
    if (wsSlider) {
      wsSlider.value = state.wordSpacing;
      wsVal.textContent = state.wordSpacing;
    }
    if (ruledBox) ruledBox.checked = state.ruled;
    if (marginBox) marginBox.checked = state.margin;
    if (bwSlider) {
      bwSlider.value = state.boldWeight;
      bwVal.textContent = state.boldWeight;
    }
    if (utSlider) {
      utSlider.value = state.underlineThickness;
      utVal.textContent = state.underlineThickness;
    }
    if (customInk) customInk.value = state.ink;

    // Set active paper button
    presetPaperButtons.forEach(btn => {
      if (btn.getAttribute('data-paper') === state.paperPreset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Set active ink button if matched
    let inkMatched = false;
    presetInkButtons.forEach(btn => {
      if (btn.getAttribute('data-ink') === state.ink) {
        btn.classList.add('active');
        inkMatched = true;
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ── Markdown to HTML Sanitized Formatter ────────────────────
  function formatMarkdownToHTML(text) {
    if (!text) return '';
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
    
    let escapedText = escapeHtml(text);
    let htmlContent = escapedText
      .replace(/\*\*([\s\S]*?)\*\*/g, `<span style="font-weight: ${state.boldWeight};">$1</span>`)
      .replace(/__([\s\S]*?)__/g, `<span style="text-decoration: underline; text-decoration-thickness: ${state.underlineThickness}px;">$1</span>`)
      .replace(/^(Date\s*:\s*[^\n]+)/im, '<span style="float: right;">$1</span>');

    const tempSanitize = document.createElement('div');
    tempSanitize.innerHTML = htmlContent;

    function sanitizeDOM(node) {
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toLowerCase();
          if (tagName === 'span') {
            const styleAttr = child.getAttribute('style') || '';
            while (child.attributes.length > 0) {
              child.removeAttribute(child.attributes[0].name);
            }
            const dummy = document.createElement('span');
            dummy.style.cssText = styleAttr;
            const allowed = ['color', 'font-size', 'font-weight', 'text-decoration', 'text-decoration-thickness', 'border-bottom', 'padding-bottom', 'display', 'float', 'text-align'];
            allowed.forEach(prop => {
              if (dummy.style[prop]) {
                child.style[prop] = dummy.style[prop];
              }
            });
            sanitizeDOM(child);
          } else if (tagName === 'br' || tagName === 'div' || tagName === 'p') {
            while (child.attributes.length > 0) {
              child.removeAttribute(child.attributes[0].name);
            }
            sanitizeDOM(child);
          } else {
            const textNode = document.createTextNode(child.outerHTML);
            node.replaceChild(textNode, child);
          }
        }
      }
    }

    sanitizeDOM(tempSanitize);
    return tempSanitize.innerHTML;
  }

  // Draw paper and apply layouts dynamically
  function render() {
    const fontSize = parseInt(state.size);
    const lineHeight = parseInt(state.lineHeight);
    
    // Update labels
    if (sizeVal) sizeVal.textContent = fontSize;
    if (lhVal) lhVal.textContent = lineHeight;
    if (lsVal) lsVal.textContent = state.letterSpacing;
    if (wsVal) wsVal.textContent = state.wordSpacing;
    const floatSizeVal = document.getElementById('float-size-val');
    if (floatSizeVal) floatSizeVal.textContent = fontSize;

    // Apply text content & fonts
    if (paperOut) {
      if (document.activeElement !== paperOut) {
        paperOut.innerHTML = formatMarkdownToHTML(state.text);
      }

      paperOut.style.fontFamily = state.font;
      paperOut.style.fontSize = fontSize + 'px';
      paperOut.style.lineHeight = lineHeight + 'px';
      paperOut.style.letterSpacing = state.letterSpacing + 'px';
      paperOut.style.wordSpacing = state.wordSpacing + 'px';
      paperOut.style.color = state.ink;
    }

    // Apply Margins
    if (paperSheet) {
      paperSheet.style.paddingLeft = state.margin ? '64px' : '40px';
    }
    if (marginLine) {
      marginLine.style.display = state.margin ? 'block' : 'none';
    }

    // Helper to resolve CSS variables to actual colors for html2canvas support
    function resolveColor(cssVarName) {
      if (cssVarName && cssVarName.startsWith('var(')) {
        const match = cssVarName.match(/var\(([^)]+)\)/);
        if (match) {
          return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
        }
      }
      return cssVarName;
    }

    // Apply Background colors and drawing lines patterns based on presets
    if (paperSheet) {
      let paperBg = 'var(--paper-bg-ruled)';
      let marginColor = 'var(--paper-margin-ruled)';
      let lineColor = 'var(--paper-line-ruled)';

      if (state.paperPreset === 'legal') {
        paperBg = 'var(--paper-bg-legal)';
        marginColor = 'var(--paper-margin-legal)';
        lineColor = 'var(--paper-line-legal)';
      } else if (state.paperPreset === 'grid') {
        paperBg = 'var(--paper-bg-grid)';
        marginColor = '';
        lineColor = 'var(--paper-line-grid)';
      } else if (state.paperPreset === 'vintage') {
        paperBg = 'var(--paper-bg-vintage)';
        marginColor = 'var(--paper-margin-vintage)';
        lineColor = 'var(--paper-line-vintage)';
      } else if (state.paperPreset === 'blank') {
        paperBg = '#ffffff';
        marginColor = '';
        lineColor = '';
      }

      // Resolve variables to absolute hex/rgb colors so html2canvas renders them
      const resolvedBg = resolveColor(paperBg);
      const resolvedMargin = marginColor ? resolveColor(marginColor) : '';
      const resolvedLine = lineColor ? resolveColor(lineColor) : '';

      paperSheet.style.backgroundColor = resolvedBg;
      if (marginLine) {
        marginLine.style.backgroundColor = resolvedMargin;
      }

      // Draw lines
      if (state.ruled && resolvedLine) {
        if (state.paperPreset === 'grid') {
          // Grid/Graph lines drawing
          paperSheet.style.backgroundImage = `
            linear-gradient(to right, ${resolvedLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${resolvedLine} 1px, transparent 1px)
          `;
          paperSheet.style.backgroundSize = `${lineHeight}px ${lineHeight}px`;
          paperSheet.style.backgroundPosition = '0 0';
          paperSheet.style.backgroundRepeat = 'repeat';
        } else if (state.paperPreset === 'blank') {
          paperSheet.style.backgroundImage = 'none';
        } else {
          // Horizontal Lined Ruled Drawing - using standard linear-gradient for html2canvas compatibility
          paperSheet.style.backgroundImage = `linear-gradient(to bottom, transparent, transparent ${lineHeight - 1}px, ${resolvedLine} ${lineHeight - 1}px, ${resolvedLine} ${lineHeight}px)`;
          paperSheet.style.backgroundSize = '100% ' + lineHeight + 'px';
          paperSheet.style.backgroundPosition = '0 30px';
          paperSheet.style.backgroundRepeat = 'repeat';
        }
      } else {
        paperSheet.style.backgroundImage = 'none';
      }
    }

    // Update stats counters
    updateStats();

    // Sync styling to all extra pages
    syncExtraPagesStyle();
  }

  function updateStats() {
    if (charCount && wordCount) {
      let combinedText = state.text || '';
      if (state.extraPages && Array.isArray(state.extraPages)) {
        state.extraPages.forEach(p => {
          if (p && p.text) combinedText += '\n' + p.text;
        });
      }
      charCount.textContent = combinedText.length;
      const words = combinedText.trim().split(/\s+/).filter(w => w.length > 0);
      wordCount.textContent = words.length;
    }
  }

  // ── Multi-Page System ────────────────────────────────────────────
  const paperWorkspace = document.querySelector('.paper-workspace');

  // Apply paper background/style to any sheet element
  function applySheetStyle(sheet, marginEl) {
    const lineHeight = parseInt(state.lineHeight);

    function resolveColor(cssVarName) {
      if (cssVarName && cssVarName.startsWith('var(')) {
        const match = cssVarName.match(/var\(([^)]+)\)/);
        if (match) return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
      }
      return cssVarName;
    }

    let paperBg = 'var(--paper-bg-ruled)', marginColor = 'var(--paper-margin-ruled)', lineColor = 'var(--paper-line-ruled)';
    if (state.paperPreset === 'legal')   { paperBg = 'var(--paper-bg-legal)';   marginColor = 'var(--paper-margin-legal)';   lineColor = 'var(--paper-line-legal)'; }
    if (state.paperPreset === 'grid')    { paperBg = 'var(--paper-bg-grid)';    marginColor = '';                            lineColor = 'var(--paper-line-grid)'; }
    if (state.paperPreset === 'vintage') { paperBg = 'var(--paper-bg-vintage)'; marginColor = 'var(--paper-margin-vintage)'; lineColor = 'var(--paper-line-vintage)'; }
    if (state.paperPreset === 'blank')   { paperBg = '#ffffff';                 marginColor = '';                            lineColor = ''; }

    const resolvedBg     = resolveColor(paperBg);
    const resolvedMargin = marginColor ? resolveColor(marginColor) : '';
    const resolvedLine   = lineColor   ? resolveColor(lineColor)   : '';

    sheet.style.backgroundColor = resolvedBg;
    sheet.style.paddingLeft = state.margin ? '64px' : '40px';

    if (marginEl) {
      marginEl.style.display = state.margin ? 'block' : 'none';
      marginEl.style.backgroundColor = resolvedMargin;
    }

    if (state.ruled && resolvedLine) {
      if (state.paperPreset === 'grid') {
        sheet.style.backgroundImage = `linear-gradient(to right, ${resolvedLine} 1px, transparent 1px), linear-gradient(to bottom, ${resolvedLine} 1px, transparent 1px)`;
        sheet.style.backgroundSize = `${lineHeight}px ${lineHeight}px`;
        sheet.style.backgroundPosition = '0 0';
      } else if (state.paperPreset !== 'blank') {
        sheet.style.backgroundImage = `linear-gradient(to bottom, transparent, transparent ${lineHeight - 1}px, ${resolvedLine} ${lineHeight - 1}px, ${resolvedLine} ${lineHeight}px)`;
        sheet.style.backgroundSize = '100% ' + lineHeight + 'px';
        sheet.style.backgroundPosition = '0 30px';
      } else {
        sheet.style.backgroundImage = 'none';
      }
    } else {
      sheet.style.backgroundImage = 'none';
    }
  }

  // Sync styles to all extra pages (called from render)
  function syncExtraPagesStyle() {
    document.querySelectorAll('.paper-sheet.extra-page').forEach(sheet => {
      const marginEl = sheet.querySelector('.paper-margin-line');
      const contentEl = sheet.querySelector('.paper-content-out');
      applySheetStyle(sheet, marginEl);
      if (contentEl) {
        contentEl.style.fontFamily     = state.font;
        contentEl.style.fontSize       = state.size + 'px';
        contentEl.style.lineHeight     = state.lineHeight + 'px';
        contentEl.style.letterSpacing  = state.letterSpacing + 'px';
        contentEl.style.wordSpacing    = state.wordSpacing + 'px';
        contentEl.style.color          = state.ink;

        // Update bold weight and underline thickness on existing spans in extra pages
        contentEl.querySelectorAll('span').forEach(span => {
          if (span.style.fontWeight && parseInt(span.style.fontWeight) >= 600) {
            span.style.fontWeight = state.boldWeight;
          }
          if (span.style.textDecoration && span.style.textDecoration.includes('underline')) {
            span.style.textDecorationThickness = state.underlineThickness + 'px';
          }
        });
      }
    });
  }

  // ── Inline editable page title label ─────────────────────────
  function makePageLabelEditable(containerSpan, getTitle, setTitle) {
    const textSpan = containerSpan.querySelector('.page-title-text');
    if (!textSpan) return;

    textSpan.style.cursor = 'pointer';
    textSpan.title = 'Click to rename page';

    textSpan.addEventListener('click', function startEdit() {
      const current = getTitle();
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'page-title-input';
      input.value = current;
      textSpan.replaceWith(input);
      input.focus();
      input.select();

      function commit() {
        const newTitle = input.value.trim() || current;
        setTitle(newTitle);
        const newTextSpan = document.createElement('span');
        newTextSpan.className = 'page-title-text';
        newTextSpan.textContent = newTitle;
        input.replaceWith(newTextSpan);
        makePageLabelEditable(containerSpan, getTitle, setTitle);
        saveState();
        document.dispatchEvent(new CustomEvent('inkflow-page-renamed'));
      }

      input.addEventListener('blur', commit, { once: true });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = current; input.blur(); }
      });
    }, { once: true });
  }

  // Create and append a new page sheet
  function addNewPage() {
    const pageIndex = state.extraPages.length; // 0-based index in extraPages
    const pageNum   = pageIndex + 2;           // Display number (page 1 is the main)
    const sheetId   = 'sheet-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    const pageDat = { text: '', title: `Page ${pageNum}`, sheetId };
    state.extraPages.push(pageDat);

    const pageWrap = document.createElement('div');
    pageWrap.className = 'page-block extra-page-block';
    pageWrap.setAttribute('data-page-index', pageIndex);

    pageWrap.innerHTML = `
      <div class="page-num-label">
        <span><i class="fa-regular fa-file"></i> <span class="page-title-text"></span></span>
        <button class="page-remove-btn" title="Remove this page"><i class="fa-solid fa-xmark"></i> Remove Page</button>
      </div>
      <div class="paper-sheet extra-page" data-sheet-id="${sheetId}">
        <div class="paper-margin-line"></div>
        <div class="paper-content-out" contenteditable="true" spellcheck="false"></div>
      </div>
    `;

    // Set title text safely via textContent
    pageWrap.querySelector('.page-title-text').textContent = pageDat.title;

    // Wire up editable title label
    const labelSpan = pageWrap.querySelector('.page-num-label > span');
    if (labelSpan) makePageLabelEditable(labelSpan, () => pageDat.title, (t) => { pageDat.title = t; });

    // Insert before the add-page strip (or append if strip doesn't exist)
    const addStrip = document.getElementById('add-page-strip');
    if (addStrip) {
      paperWorkspace.insertBefore(pageWrap, addStrip);
    } else {
      paperWorkspace.appendChild(pageWrap);
    }

    const sheet      = pageWrap.querySelector('.paper-sheet');
    const marginEl   = pageWrap.querySelector('.paper-margin-line');
    const contentOut = pageWrap.querySelector('.paper-content-out');

    // Apply current styling
    applySheetStyle(sheet, marginEl);
    contentOut.style.fontFamily    = state.font;
    contentOut.style.fontSize      = state.size + 'px';
    contentOut.style.lineHeight    = state.lineHeight + 'px';
    contentOut.style.letterSpacing = state.letterSpacing + 'px';
    contentOut.style.wordSpacing   = state.wordSpacing + 'px';
    contentOut.style.color         = state.ink;

    // Sync content changes back to state
    contentOut.addEventListener('input', () => {
      pageDat.text = htmlToMarkdown(contentOut.innerHTML);
      saveState();
    });

    // Remove page button
    pageWrap.querySelector('.page-remove-btn').addEventListener('click', () => {
      if (confirm(`Remove "${pageDat.title}"? All content on this page will be lost.`)) {
        const idx = state.extraPages.indexOf(pageDat);
        if (idx !== -1) state.extraPages.splice(idx, 1);
        pageWrap.remove();
        renumberPages();
        saveState();
      }
    });

    // Scroll into view
    setTimeout(() => sheet.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    saveState();
    updatePageSelectDropdown();
    setActivePage(state.extraPages.length);
  }

  // Re-index page blocks after a removal (titles are custom; only update data attribute)
  function renumberPages() {
    const blocks = document.querySelectorAll('.extra-page-block');
    blocks.forEach((block, i) => {
      block.setAttribute('data-page-index', i);
    });
  }

  // Restore extra pages from saved state on load
  function restoreExtraPages() {
    // Clear any existing extra page DOM blocks
    document.querySelectorAll('.extra-page-block').forEach(el => el.remove());

    if (!state.extraPages || !Array.isArray(state.extraPages) || state.extraPages.length === 0) {
      state.extraPages = [];
      return;
    }

    const pagesToRestore = JSON.parse(JSON.stringify(state.extraPages));
    state.extraPages = []; // Will be populated as pages are created

    pagesToRestore.forEach((savedDat, idx) => {
      const pageNum = idx + 2;
      const sheetId = savedDat.sheetId || ('sheet-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6));
      const title = savedDat.title || `Page ${pageNum}`;
      const text = savedDat.text || '';
      const height = savedDat.height || null;

      const pageDat = { text, title, sheetId, height };
      state.extraPages.push(pageDat);

      const pageWrap = document.createElement('div');
      pageWrap.className = 'page-block extra-page-block';
      pageWrap.setAttribute('data-page-index', idx);

      pageWrap.innerHTML = `
        <div class="page-num-label">
          <span><i class="fa-regular fa-file"></i> <span class="page-title-text"></span></span>
          <button class="page-remove-btn" title="Remove this page"><i class="fa-solid fa-xmark"></i> Remove Page</button>
        </div>
        <div class="paper-sheet extra-page" data-sheet-id="${sheetId}">
          <div class="paper-margin-line"></div>
          <div class="paper-content-out" contenteditable="true" spellcheck="false"></div>
        </div>
      `;

      pageWrap.querySelector('.page-title-text').textContent = title;

      const labelSpan = pageWrap.querySelector('.page-num-label > span');
      if (labelSpan) makePageLabelEditable(labelSpan, () => pageDat.title, (t) => { pageDat.title = t; });

      const addStrip = document.getElementById('add-page-strip');
      if (addStrip) {
        paperWorkspace.insertBefore(pageWrap, addStrip);
      } else {
        paperWorkspace.appendChild(pageWrap);
      }

      const sheet = pageWrap.querySelector('.paper-sheet');
      const marginEl = pageWrap.querySelector('.paper-margin-line');
      const contentOut = pageWrap.querySelector('.paper-content-out');

      contentOut.innerHTML = formatMarkdownToHTML(text);

      applySheetStyle(sheet, marginEl);
      if (height && sheet) {
        sheet.style.minHeight = 'auto';
        sheet.style.height = height + 'px';
        sheet.classList.add('sliced-paper');
      }

      contentOut.style.fontFamily    = state.font;
      contentOut.style.fontSize      = state.size + 'px';
      contentOut.style.lineHeight    = state.lineHeight + 'px';
      contentOut.style.letterSpacing = state.letterSpacing + 'px';
      contentOut.style.wordSpacing   = state.wordSpacing + 'px';
      contentOut.style.color         = state.ink;

      contentOut.addEventListener('input', () => {
        pageDat.text = htmlToMarkdown(contentOut.innerHTML);
        saveState();
      });

      pageWrap.querySelector('.page-remove-btn').addEventListener('click', () => {
        if (confirm(`Remove "${pageDat.title}"? All content on this page will be lost.`)) {
          const i = state.extraPages.indexOf(pageDat);
          if (i !== -1) state.extraPages.splice(i, 1);
          pageWrap.remove();
          renumberPages();
          saveState();
          setActivePage(0, true);
        }
      });
    });
    updatePageSelectDropdown();
  }

  // Initialise the "Add New Page" strip at the bottom of the workspace
  function initAddPageStrip() {
    if (!paperWorkspace) return;
    const strip = document.createElement('div');
    strip.id = 'add-page-strip';
    strip.className = 'add-page-strip';
    strip.innerHTML = `<button id="btn-add-page" class="add-page-btn"><i class="fa-solid fa-plus"></i> Add New Page</button>`;
    paperWorkspace.appendChild(strip);
    strip.querySelector('#btn-add-page').addEventListener('click', addNewPage);
  }

  // Insert a new page immediately after a specific block (null = after page 1).
  // Used by the slicer and snapshot restore.
  function insertPageAfterBlock(afterBlock, initialText, initialHeight) {
    const sheetId = 'sheet-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const pageDat = { text: initialText || '', height: initialHeight || null, title: 'Page', sheetId };

    // Determine insertion index in state.extraPages
    let insertAtIdx = 0;
    if (afterBlock) {
      const extraBlocks = [...document.querySelectorAll('.extra-page-block')];
      const idx = extraBlocks.indexOf(afterBlock);
      insertAtIdx = (idx >= 0) ? idx + 1 : state.extraPages.length;
    }
    state.extraPages.splice(insertAtIdx, 0, pageDat);

    // Build DOM block
    const pageWrap = document.createElement('div');
    pageWrap.className = 'page-block extra-page-block';
    pageWrap.innerHTML = `
      <div class="page-num-label">
        <span><i class="fa-regular fa-file"></i> <span class="page-title-text"></span></span>
        <button class="page-remove-btn" title="Remove this page"><i class="fa-solid fa-xmark"></i> Remove Page</button>
      </div>
      <div class="paper-sheet extra-page" data-sheet-id="${sheetId}">
        <div class="paper-margin-line"></div>
        <div class="paper-content-out" contenteditable="true" spellcheck="false"></div>
      </div>
    `;

    // Set title safely via textContent
    pageWrap.querySelector('.page-title-text').textContent = pageDat.title;

    // Wire editable label
    const labelSpan = pageWrap.querySelector('.page-num-label > span');
    if (labelSpan) makePageLabelEditable(labelSpan, () => pageDat.title, (t) => { pageDat.title = t; });

    // Determine DOM insertion point
    const addStrip = document.getElementById('add-page-strip');
    let insertBeforeNode;

    if (!afterBlock) {
      // After page 1 — before the first existing extra block (if any)
      insertBeforeNode = document.querySelector('.extra-page-block') || addStrip;
    } else {
      insertBeforeNode = afterBlock.nextSibling || addStrip;
    }

    if (insertBeforeNode) {
      paperWorkspace.insertBefore(pageWrap, insertBeforeNode);
    } else {
      paperWorkspace.appendChild(pageWrap);
    }

    const contentOut = pageWrap.querySelector('.paper-content-out');
    const sheet      = pageWrap.querySelector('.paper-sheet');
    const marginEl   = pageWrap.querySelector('.paper-margin-line');

    contentOut.innerHTML = formatMarkdownToHTML(initialText || '');

    // Apply current styling
    applySheetStyle(sheet, marginEl);
    if (initialHeight && sheet) {
      sheet.style.minHeight = 'auto';
      sheet.style.height = initialHeight + 'px';
      sheet.classList.add('sliced-paper');
    }
    contentOut.style.fontFamily    = state.font;
    contentOut.style.fontSize      = state.size + 'px';
    contentOut.style.lineHeight    = state.lineHeight + 'px';
    contentOut.style.letterSpacing = state.letterSpacing + 'px';
    contentOut.style.wordSpacing   = state.wordSpacing + 'px';
    contentOut.style.color         = state.ink;

    // Wire input sync
    contentOut.addEventListener('input', () => {
      pageDat.text = htmlToMarkdown(contentOut.innerHTML);
      saveState();
    });

    // Wire remove button
    pageWrap.querySelector('.page-remove-btn').addEventListener('click', () => {
      if (confirm('Remove this page? All content will be lost.')) {
        const idx = state.extraPages.indexOf(pageDat);
        if (idx !== -1) state.extraPages.splice(idx, 1);
        pageWrap.remove();
        renumberPages();
        saveState();
      }
    });

    renumberPages();
    updatePageSelectDropdown();
    return pageWrap;
  }

  // Attach event handlers
  // Attach event handlers
  if (txt) {
    txt.addEventListener('input', (e) => {
      const val = e.target.value;
      if (activePageIndex === 0) {
        state.text = val;
        render();
      } else {
        const extraIdx = activePageIndex - 1;
        if (state.extraPages && state.extraPages[extraIdx]) {
          state.extraPages[extraIdx].text = val;
          const blocks = document.querySelectorAll('.extra-page-block');
          const block = blocks[extraIdx];
          if (block) {
            const co = block.querySelector('.paper-content-out');
            if (co) co.innerHTML = formatMarkdownToHTML(val);
          }
        }
      }
      saveState();
      updateStats();
    });

    txt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const start = txt.selectionStart;
        const currentLineStart = txt.value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = txt.value.substring(currentLineStart, start);

        // Match lists like "1. ", "1) ", "a. ", "- "
        const listMatch = currentLine.match(/^(\s*)([0-9]+[.)]|\*|-|\+)\s+/);

        if (listMatch) {
          e.preventDefault();
          const indent = listMatch[1];
          let bullet = listMatch[2];

          if (/^[0-9]+[.)]$/.test(bullet)) {
            const num = parseInt(bullet, 10);
            const separator = bullet.replace(/[0-9]/g, '');
            bullet = (num + 1) + separator;
          }

          const insertText = '\n' + indent + bullet + ' ';
          const newText = txt.value.substring(0, start) + insertText + txt.value.substring(txt.selectionEnd);
          txt.value = newText;

          if (activePageIndex === 0) {
            state.text = newText;
            render();
          } else {
            const extraIdx = activePageIndex - 1;
            if (state.extraPages && state.extraPages[extraIdx]) {
              state.extraPages[extraIdx].text = newText;
              const blocks = document.querySelectorAll('.extra-page-block');
              const block = blocks[extraIdx];
              if (block) {
                const co = block.querySelector('.paper-content-out');
                if (co) co.innerHTML = formatMarkdownToHTML(newText);
              }
            }
          }

          txt.setSelectionRange(start + insertText.length, start + insertText.length);
          saveState();
          updateStats();
        }
      }
    });
  }

  // ── Active Page Management for Sidebar Text Area & Canvas ──────
  function updatePageSelectDropdown() {
    if (!pageSelect) return;
    pageSelect.innerHTML = '';
    const p1Title = state.page1Title || 'Page 1';
    const opt1 = document.createElement('option');
    opt1.value = '0';
    opt1.textContent = p1Title;
    pageSelect.appendChild(opt1);

    if (state.extraPages && Array.isArray(state.extraPages)) {
      state.extraPages.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = (idx + 1).toString();
        opt.textContent = p.title || `Page ${idx + 2}`;
        pageSelect.appendChild(opt);
      });
    }

    const totalPages = 1 + (state.extraPages ? state.extraPages.length : 0);
    if (activePageIndex >= totalPages) {
      activePageIndex = Math.max(0, totalPages - 1);
    }
    pageSelect.value = activePageIndex.toString();
  }

  function setActivePage(index, skipScroll = false) {
    const totalPages = 1 + (state.extraPages ? state.extraPages.length : 0);
    activePageIndex = Math.max(0, Math.min(index, totalPages - 1));

    updatePageSelectDropdown();

    // Update textarea content for active page
    let activeText = '';
    if (activePageIndex === 0) {
      activeText = state.text;
    } else if (state.extraPages && state.extraPages[activePageIndex - 1]) {
      activeText = state.extraPages[activePageIndex - 1].text || '';
    }

    if (txt && document.activeElement !== txt) {
      txt.value = activeText;
    }

    // Scroll to active page sheet if requested
    if (!skipScroll) {
      let targetSheet = null;
      if (activePageIndex === 0) {
        targetSheet = paperSheet;
      } else {
        const blocks = document.querySelectorAll('.extra-page-block');
        const block = blocks[activePageIndex - 1];
        if (block) targetSheet = block.querySelector('.paper-sheet');
      }
      if (targetSheet) {
        targetSheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Add outline highlight to active sheet
    const allSheets = document.querySelectorAll('.paper-sheet');
    allSheets.forEach((sheet, idx) => {
      if (idx === activePageIndex) {
        sheet.classList.add('active-page-sheet');
      } else {
        sheet.classList.remove('active-page-sheet');
      }
    });
  }

  if (pageSelect) {
    pageSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      setActivePage(idx);
    });
  }

  if (paperWorkspace) {
    paperWorkspace.addEventListener('mousedown', (e) => {
      const sheet = e.target.closest('.paper-sheet');
      if (sheet) {
        const blocks = [...document.querySelectorAll('.paper-sheet')];
        const idx = blocks.indexOf(sheet);
        if (idx !== -1 && idx !== activePageIndex) {
          setActivePage(idx, true);
        }
      }
    });

    paperWorkspace.addEventListener('focusin', (e) => {
      const sheet = e.target.closest('.paper-sheet');
      if (sheet) {
        const blocks = [...document.querySelectorAll('.paper-sheet')];
        const idx = blocks.indexOf(sheet);
        if (idx !== -1 && idx !== activePageIndex) {
          setActivePage(idx, true);
        }
      }
    });

    paperWorkspace.addEventListener('input', (e) => {
      const sheet = e.target.closest('.paper-sheet');
      if (sheet) {
        const blocks = [...document.querySelectorAll('.paper-sheet')];
        const idx = blocks.indexOf(sheet);
        if (idx !== -1) {
          if (idx !== activePageIndex) setActivePage(idx, true);
          const co = sheet.querySelector('.paper-content-out');
          if (co) {
            const md = htmlToMarkdown(co.innerHTML);
            if (idx === 0) {
              state.text = md;
            } else if (state.extraPages && state.extraPages[idx - 1]) {
              state.extraPages[idx - 1].text = md;
            }
            if (txt && document.activeElement !== txt) {
              txt.value = md;
            }
            saveState();
            updateStats();
          }
        }
      }
    });
  }

  document.addEventListener('inkflow-page-renamed', () => {
    updatePageSelectDropdown();
  });

  // Helper to get whichever paper sheet content editable element currently holds the user selection
  function getSelectedSheetContent() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.anchorNode) return null;
    const node = selection.anchorNode;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return el ? el.closest('.paper-content-out') : null;
  }

  // Helper to check if selection is inside ANY paper sheet
  function isSelectionInSheet() {
    return getSelectedSheetContent() !== null;
  }

  // Helper to wrap formatting styles selection-specifically on whichever sheet is selected
  function applyStyleToSelection(styleName, styleValue) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const targetOut = getSelectedSheetContent();
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style[styleName] = styleValue;

    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    } catch (err) {
      console.error("Failed to wrap selection styling:", err);
    }

    if (targetOut) {
      targetOut.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (paperOut) {
      paperOut.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Wrap selected text in textarea
  function insertFormatting(prefix, suffix) {
    if (!txt) return;
    const start = txt.selectionStart;
    const end = txt.selectionEnd;
    const selectedText = txt.value.substring(start, end);
    const newText = txt.value.substring(0, start) + prefix + selectedText + suffix + txt.value.substring(end);

    txt.value = newText;

    if (activePageIndex === 0) {
      state.text = newText;
      render();
    } else {
      const extraIdx = activePageIndex - 1;
      if (state.extraPages && state.extraPages[extraIdx]) {
        state.extraPages[extraIdx].text = newText;
        const blocks = document.querySelectorAll('.extra-page-block');
        const block = blocks[extraIdx];
        if (block) {
          const co = block.querySelector('.paper-content-out');
          if (co) co.innerHTML = formatMarkdownToHTML(newText);
        }
      }
    }

    setTimeout(() => {
      txt.focus();
      txt.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);

    saveState();
    updateStats();
  }

  if (btnBold) {
    btnBold.addEventListener('click', () => {
      const targetOut = getSelectedSheetContent() || (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('paper-content-out') ? document.activeElement : null);
      if (targetOut) {
        document.execCommand('bold');
        targetOut.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        insertFormatting('**', '**');
      }
    });
  }

  if (btnUnderline) {
    btnUnderline.addEventListener('click', () => {
      const targetOut = getSelectedSheetContent() || (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('paper-content-out') ? document.activeElement : null);
      if (targetOut) {
        document.execCommand('underline');
        targetOut.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        insertFormatting('__', '__');
      }
    });
  }

  if (bwSlider) {
    bwSlider.addEventListener('input', (e) => {
      state.boldWeight = parseInt(e.target.value);
      if (bwVal) bwVal.textContent = state.boldWeight;
      render();
      saveState();
    });
  }

  if (utSlider) {
    utSlider.addEventListener('input', (e) => {
      state.underlineThickness = parseInt(e.target.value);
      if (utVal) utVal.textContent = state.underlineThickness;
      render();
      saveState();
    });
  }

  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      state.font = e.target.value;
      render();
      saveState();
    });
  }

  if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
      const newSize = parseInt(e.target.value);
      if (isSelectionInSheet()) {
        applyStyleToSelection('fontSize', newSize + 'px');
      } else {
        state.size = newSize;
        render();
        saveState();
      }
    });
  }

  if (lhSlider) {
    lhSlider.addEventListener('input', (e) => {
      state.lineHeight = parseInt(e.target.value);
      render();
      saveState();
    });
  }

  if (lsSlider) {
    lsSlider.addEventListener('input', (e) => {
      state.letterSpacing = parseFloat(e.target.value);
      render();
      saveState();
    });
  }

  if (wsSlider) {
    wsSlider.addEventListener('input', (e) => {
      state.wordSpacing = parseFloat(e.target.value);
      render();
      saveState();
    });
  }

  if (ruledBox) {
    ruledBox.addEventListener('change', (e) => {
      state.ruled = e.target.checked;
      render();
      saveState();
    });
  }

  if (marginBox) {
    marginBox.addEventListener('change', (e) => {
      state.margin = e.target.checked;
      render();
      saveState();
    });
  }

  if (customInk) {
    customInk.addEventListener('input', (e) => {
      const color = e.target.value;
      if (isSelectionInSheet()) {
        applyStyleToSelection('color', color);
      } else {
        state.ink = color;
        // remove active classes on preset inks
        presetInkButtons.forEach(btn => btn.classList.remove('active'));
        render();
        saveState();
      }
    });
  }

  // Preset Paper event list
  presetPaperButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-paper');
      state.paperPreset = preset;
      
      presetPaperButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      render();
      saveState();
    });
  });

  // Preset Ink event list
  presetInkButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const ink = btn.getAttribute('data-ink');
      if (isSelectionInSheet()) {
        applyStyleToSelection('color', ink);
      } else {
        state.ink = ink;
        if (customInk) customInk.value = ink;

        presetInkButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        render();
        saveState();
      }
    });
  });

  // ── Page Picker Modal (shared by download & share) ────────────
  // Returns a Promise that resolves with an array of selected page objects { label, sheet },
  // or null if user cancelled.
  function openPagePickerModal(actionLabel) {
    return new Promise((resolve) => {
      // Build the list of all pages with dynamic titles and sheets
      const allPages = [];
      const page1Title = state.page1Title || 'Page 1';
      allPages.push({ label: page1Title, sheet: paperSheet });

      document.querySelectorAll('.extra-page-block').forEach((block, i) => {
        const sheet = block.querySelector('.paper-sheet');
        const customTitle = (state.extraPages[i] && state.extraPages[i].title)
          ? state.extraPages[i].title
          : (block.querySelector('.page-title-text')?.textContent.trim() || `Page ${i + 2}`);
        if (sheet) allPages.push({ label: customTitle, sheet });
      });

      // If only one page, skip the modal
      if (allPages.length === 1) {
        resolve([allPages[0]]);
        return;
      }

      // Build modal HTML
      const overlay = document.createElement('div');
      overlay.className = 'note-modal-overlay';
      overlay.innerHTML = `
        <div class="note-modal" style="max-width: 480px;">
          <h3><i class="fa-solid fa-images"></i> Select Pages to ${actionLabel}</h3>
          <p>Your note has <strong>${allPages.length} pages</strong>. Choose which pages to ${actionLabel.toLowerCase()} — each will be a separate image.</p>
          <div class="page-picker-list" style="display:flex; flex-direction:column; gap:10px; margin:16px 0 20px;">
            ${allPages.map((p, i) => `
              <label class="page-picker-item" style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:var(--radius-md); border:1px solid var(--border-color); cursor:pointer; transition:border-color 0.2s, background-color 0.2s; user-select:none;" data-idx="${i}">
                <input type="checkbox" value="${i}" checked style="width:16px;height:16px;accent-color:var(--accent-color);cursor:pointer;">
                <i class="fa-regular fa-file" style="color:var(--accent-color); font-size:16px;"></i>
                <span style="font-weight:600; font-size:14px;">${p.label}</span>
                <span style="margin-left:auto; font-size:11px; color:var(--text-tertiary); font-weight:500;">will be shared as image</span>
              </label>
            `).join('')}
          </div>
          <div style="display:flex; gap:10px;">
            <button id="pp-select-all" class="btn btn-secondary" style="font-size:12px; padding:8px 14px;">Select All</button>
            <div style="flex:1;"></div>
            <button id="pp-cancel" class="btn btn-secondary" style="flex:1; padding:12px;"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button id="pp-confirm" class="btn btn-primary" style="flex:1; padding:12px;"><i class="fa-solid fa-check"></i> ${actionLabel}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));

      // Style checked items
      function refreshItemStyles() {
        overlay.querySelectorAll('.page-picker-item').forEach(item => {
          const cb = item.querySelector('input[type=checkbox]');
          item.style.borderColor = cb.checked ? 'var(--accent-color)' : 'var(--border-color)';
          item.style.backgroundColor = cb.checked ? 'var(--accent-light)' : '';
        });
      }
      refreshItemStyles();

      // Clicking the label toggles checkbox
      overlay.querySelectorAll('.page-picker-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.tagName === 'INPUT') return; // already handled
          const cb = item.querySelector('input[type=checkbox]');
          cb.checked = !cb.checked;
          refreshItemStyles();
        });
        item.querySelector('input').addEventListener('change', refreshItemStyles);
      });

      // Select All toggle
      const ppSelectAll = overlay.querySelector('#pp-select-all');
      let allSelected = true;
      ppSelectAll.addEventListener('click', () => {
        allSelected = !allSelected;
        overlay.querySelectorAll('.page-picker-item input').forEach(cb => cb.checked = allSelected);
        ppSelectAll.textContent = allSelected ? 'Select All' : 'Deselect All';
        refreshItemStyles();
      });

      function closeModal(result) {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 280);
        resolve(result);
      }

      overlay.querySelector('#pp-cancel').addEventListener('click', () => closeModal(null));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(null); });

      overlay.querySelector('#pp-confirm').addEventListener('click', () => {
        const checked = [...overlay.querySelectorAll('.page-picker-item input:checked')];
        if (checked.length === 0) {
          alert('Please select at least one page.');
          return;
        }
        const selectedPages = checked.map(cb => allPages[parseInt(cb.value)]);
        closeModal(selectedPages);
      });
    });
  }

  // ── Capture a single sheet element to a canvas ─────────────────
  async function captureSheet(sheet) {
    const stampControls = document.getElementById('stamp-controls');
    const wasStampVisible = stampControls && stampControls.style.display !== 'none';
    if (wasStampVisible) stampControls.style.display = 'none';
    try {
      return await html2canvas(sheet, { scale: 2, useCORS: true, backgroundColor: null });
    } finally {
      if (wasStampVisible) stampControls.style.display = 'block';
    }
  }

  // Download Image Action (multi-page aware)
  async function downloadImage() {
    if (typeof html2canvas === 'undefined') {
      alert('Error: html2canvas library is not loaded.');
      return;
    }

    const selectedPages = await openPagePickerModal('Download');
    if (!selectedPages) return; // user cancelled

    showToast(`Downloading ${selectedPages.length} page${selectedPages.length > 1 ? 's' : ''}...`);

    for (let i = 0; i < selectedPages.length; i++) {
      try {
        const pageObj = selectedPages[i];
        const safeName = pageObj.label.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || `Page_${i + 1}`;
        const canvas = await captureSheet(pageObj.sheet);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Inkflow_${safeName}.png`;
        a.click();
        if (i < selectedPages.length - 1) await new Promise(r => setTimeout(r, 400));
      } catch (e) {
        console.error(`Failed to generate image for page ${i + 1}`, e);
        alert(`Failed to generate image for ${selectedPages[i].label}.`);
      }
    }
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', downloadImage);
  }

  // Share Note Action (multi-page aware)
  async function shareNote() {
    if (typeof html2canvas === 'undefined') {
      alert('Error: html2canvas library is not loaded.');
      return;
    }

    const selectedPages = await openPagePickerModal('Share');
    if (!selectedPages) return; // user cancelled

    showToast('Preparing images to share...');

    try {
      // Capture all selected pages into File objects
      const files = [];
      for (let i = 0; i < selectedPages.length; i++) {
        const pageObj = selectedPages[i];
        const safeName = pageObj.label.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || `Page_${i + 1}`;
        const canvas = await captureSheet(pageObj.sheet);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        if (!blob) continue;
        files.push(new File([blob], `Inkflow_${safeName}.png`, { type: 'image/png' }));
      }

      if (files.length === 0) {
        alert('Could not prepare any images.');
        return;
      }

      // Try Web Share API with files
      if (navigator.canShare && navigator.canShare({ files })) {
        try {
          await navigator.share({ files });
          return;
        } catch (err) {
          console.log('Share API failed or user cancelled', err);
        }
      } else {
        // Fallback: auto-download all files
        alert(`Your browser doesn't support native sharing.\nDownloading ${files.length} image${files.length > 1 ? 's' : ''} instead.`);
        for (const file of files) {
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (e) {
      console.error('Failed to share image', e);
      alert('Failed to share image.');
    }
  }

  if (btnShare) {
    btnShare.addEventListener('click', shareNote);
  }

  // Clear workspace action (New Note)
  function clearWorkspace() {
    if (confirm('Are you sure you want to clear your notepad text to start a new note?')) {
      const today = new Date();
      const dateStr = `Date: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      state.text = `${dateStr}\n\n`;
      state.page1Title = 'Page 1';
      state.page1Height = null;

      // Reset Page 1 label title text in DOM
      const page1TitleSpan = document.getElementById('page-1-title-span');
      if (page1TitleSpan) {
        const titleTextEl = page1TitleSpan.querySelector('.page-title-text');
        if (titleTextEl) titleTextEl.textContent = 'Page 1';
      }

      // Remove all extra pages
      state.extraPages = [];
      document.querySelectorAll('.extra-page-block').forEach(el => el.remove());
      render();
      setActivePage(0, true);
      saveState();
      document.dispatchEvent(new CustomEvent('inkflow-clear'));
    }
  }

  if (btnClear) {
    btnClear.addEventListener('click', clearWorkspace);
  }

  // Sidebar Add New Page button
  const btnAddPageSidebar = document.getElementById('btn-add-page-sidebar');
  if (btnAddPageSidebar) {
    btnAddPageSidebar.addEventListener('click', addNewPage);
  }

  // ── Save Note to Library ──────────────────────────────────────
  const NOTES_KEY = 'inkflow_saved_notes';

  function saveNoteToLibrary(title) {
    // ── Flush latest content from Page 1 and all Extra Pages ──
    if (paperOut) {
      const md = htmlToMarkdown(paperOut.innerHTML);
      if (md !== state.text) {
        state.text = md;
        if (txt) txt.value = md;
      }
    }
    syncExtraPagesFromDOM();

    const allNotes = (() => {
      try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); }
      catch (e) { return []; }
    })();

    const note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      title: title.trim(),
      text: state.text,
      font: state.font,
      size: state.size,
      lineHeight: state.lineHeight,
      letterSpacing: state.letterSpacing,
      wordSpacing: state.wordSpacing,
      ink: state.ink,
      paperPreset: state.paperPreset,
      ruled: state.ruled,
      margin: state.margin,
      boldWeight: state.boldWeight,
      underlineThickness: state.underlineThickness,
      page1Height: state.page1Height,
      page1Title: state.page1Title || 'Page 1',
      extraPages: JSON.parse(JSON.stringify(state.extraPages)), // deep snapshot
      savedAt: new Date().toISOString()
    };

    allNotes.unshift(note); // Newest first
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(allNotes));
      showToast('Note saved to library! <a href="notes.html" style="color:var(--accent-color);text-decoration:underline;margin-left:6px;">View Notes →</a>');
    } catch (e) {
      showToast('Failed to save note (storage full?)', true);
    }
  }

  // ── Toast Helper ──────────────────────────────────────────────
  function showToast(msg, isError = false) {
    let toast = document.getElementById('ink-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ink-toast';
      toast.className = 'ink-toast';
      document.body.appendChild(toast);
    }
    toast.className = 'ink-toast' + (isError ? ' error' : '');
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${msg}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // ── Save Note Modal wiring ─────────────────────────────────────
  const btnSaveNote    = document.getElementById('btn-save-note');
  const saveNoteModal  = document.getElementById('save-note-modal');
  const saveNoteTitle  = document.getElementById('save-note-title');
  const saveNoteConfirm = document.getElementById('save-note-confirm');
  const saveNoteCancel  = document.getElementById('save-note-cancel');

  function openSaveModal() {
    if (!saveNoteModal) return;
    // Pre-fill with the first line of the text as a suggested title
    const firstLine = state.text.split('\n')[0].replace(/[*_]+/g, '').trim();
    if (saveNoteTitle) {
      saveNoteTitle.value = firstLine.substring(0, 60);
    }
    saveNoteModal.classList.add('open');
    setTimeout(() => { if (saveNoteTitle) saveNoteTitle.focus(); }, 120);
  }

  function closeSaveModal() {
    if (saveNoteModal) saveNoteModal.classList.remove('open');
  }

  if (btnSaveNote) btnSaveNote.addEventListener('click', openSaveModal);

  if (saveNoteConfirm) {
    saveNoteConfirm.addEventListener('click', () => {
      const title = saveNoteTitle ? saveNoteTitle.value.trim() : '';
      if (!title) {
        saveNoteTitle && saveNoteTitle.focus();
        saveNoteTitle && (saveNoteTitle.style.borderColor = '#ef4444');
        setTimeout(() => { if (saveNoteTitle) saveNoteTitle.style.borderColor = ''; }, 1500);
        return;
      }
      saveNoteToLibrary(title);
      closeSaveModal();
    });
  }

  if (saveNoteCancel) saveNoteCancel.addEventListener('click', closeSaveModal);

  // Close modal on overlay click
  if (saveNoteModal) {
    saveNoteModal.addEventListener('click', (e) => {
      if (e.target === saveNoteModal) closeSaveModal();
    });
  }

  // Enter key to confirm inside modal
  if (saveNoteTitle) {
    saveNoteTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveNoteConfirm && saveNoteConfirm.click(); }
      if (e.key === 'Escape') closeSaveModal();
    });
  }

  // Print Action
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Keyboard Shortcuts for Fast Typing
  document.addEventListener('keydown', (e) => {
    // Check if ctrl key or meta key (Mac) is pressed
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl) {
      if (e.shiftKey && !e.altKey) {
        // Ctrl + Shift + S : Save Note to Library
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          openSaveModal();
        }
      }
      else if (e.altKey) {
        // Ctrl + Alt + S : Share Note
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          shareNote();
        }
        // Ctrl + Alt + N : New Note
        else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          clearWorkspace();
        }
      }
      else {
        // Ctrl + B : Bold Text
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          const targetOut = getSelectedSheetContent() || (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('paper-content-out') ? document.activeElement : null);
          if (targetOut) {
            document.execCommand('bold');
            targetOut.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            insertFormatting('**', '**');
          }
        }
        // Ctrl + U : Underline Text
        else if (e.key.toLowerCase() === 'u') {
          e.preventDefault();
          const targetOut = getSelectedSheetContent() || (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('paper-content-out') ? document.activeElement : null);
          if (targetOut) {
            document.execCommand('underline');
            targetOut.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            insertFormatting('__', '__');
          }
        }
        // Ctrl + S : Download Image
        else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          downloadImage();
        }
      }
    }
  });

  // ── HTML to Markdown Parser ──────────────────────────────────
  function htmlToMarkdown(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    let lines = [];
    let currentLine = '';

    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        currentLine += node.textContent;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        if (tagName === 'br') {
          lines.push(currentLine);
          currentLine = '';
          return;
        }

        let prefix = '';
        let suffix = '';

        // Match styled tags & spans
        const computedWeight = node.style.fontWeight || window.getComputedStyle(node).fontWeight;
        const isBold = (computedWeight && (parseInt(computedWeight) >= 600 || computedWeight === 'bold')) || tagName === 'b' || tagName === 'strong';
        const computedDecoration = node.style.textDecoration || window.getComputedStyle(node).textDecoration;
        const isUnderline = node.style.borderBottom || (computedDecoration && computedDecoration.includes('underline')) || tagName === 'u';

        if (isBold) { prefix += '**'; suffix = '**' + suffix; }
        if (isUnderline) { prefix += '__'; suffix = '__' + suffix; }

        // Match inline color and font-size wrappers
        let styleStr = '';
        const colorVal = node.style.color || (tagName === 'font' && node.getAttribute('color'));
        if (colorVal) styleStr += `color: ${colorVal}; `;
        const sizeVal = node.style.fontSize;
        if (sizeVal) styleStr += `font-size: ${sizeVal}; `;

        // Do not restore styling span for the floated Date header
        const isDateFloat = tagName === 'span' && node.style.float === 'right' && /^Date\s*:/i.test(node.textContent);

        if (styleStr && !isDateFloat) {
          prefix = `<span style="${styleStr.trim()}">` + prefix;
          suffix = suffix + `</span>`;
        }

        currentLine += prefix;

        const isBlock = tagName === 'div' || tagName === 'p';
        if (isBlock && currentLine !== '') {
          lines.push(currentLine);
          currentLine = '';
        }

        node.childNodes.forEach(child => traverse(child));
        currentLine += suffix;

        if (isBlock) {
          lines.push(currentLine);
          currentLine = '';
        }
      }
    }

    temp.childNodes.forEach(child => traverse(child));
    if (currentLine !== '') {
      lines.push(currentLine);
    }

    return lines
      .map(line => line.replace(/\r/g, '').trimEnd())
      .join('\n');
  }

  // ── Direct editing content sync ──────────────────────────────
  if (paperOut) {
    paperOut.addEventListener('input', () => {
      const md = htmlToMarkdown(paperOut.innerHTML);
      if (txt && txt.value !== md) {
        txt.value = md;
        state.text = md;
        saveState();
        updateStats();
      }
    });
  }

  // ── Floating Rich Text Formatting Toolbar ──────────────────────
  const floatingToolbar = document.getElementById('floating-toolbar');
  
  if (floatingToolbar) {
    // Prevent toolbar click from clearing text selection in paper sheets
    floatingToolbar.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    // Bold click
    const floatBoldBtn = document.getElementById('float-bold');
    if (floatBoldBtn) {
      floatBoldBtn.addEventListener('click', () => {
        const targetOut = getSelectedSheetContent();
        document.execCommand('bold');
        if (targetOut) {
          targetOut.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }

    // Underline click
    const floatUnderlineBtn = document.getElementById('float-underline');
    if (floatUnderlineBtn) {
      floatUnderlineBtn.addEventListener('click', () => {
        const targetOut = getSelectedSheetContent();
        document.execCommand('underline');
        if (targetOut) {
          targetOut.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }

    // Size increment/decrement selection-specifically
    const floatSizeUp = document.getElementById('float-size-up');
    const floatSizeDown = document.getElementById('float-size-down');

    if (floatSizeUp) {
      floatSizeUp.addEventListener('click', () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const parent = range.commonAncestorContainer.parentElement;
        const currentSize = parent ? parseInt(window.getComputedStyle(parent).fontSize) : parseInt(state.size);
        const newSize = Math.min(80, currentSize + 2);
        
        applyStyleToSelection('fontSize', newSize + 'px');
        
        const floatSizeVal = document.getElementById('float-size-val');
        if (floatSizeVal) floatSizeVal.textContent = newSize;
      });
    }

    if (floatSizeDown) {
      floatSizeDown.addEventListener('click', () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const parent = range.commonAncestorContainer.parentElement;
        const currentSize = parent ? parseInt(window.getComputedStyle(parent).fontSize) : parseInt(state.size);
        const newSize = Math.max(12, currentSize - 2);
        
        applyStyleToSelection('fontSize', newSize + 'px');
        
        const floatSizeVal = document.getElementById('float-size-val');
        if (floatSizeVal) floatSizeVal.textContent = newSize;
      });
    }

    // Color selectors selection-specifically
    const floatColorBtns = floatingToolbar.querySelectorAll('.float-color-btn');
    floatColorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        applyStyleToSelection('color', color);
      });
    });

    // Detect selection change and position toolbar over ANY paper sheet
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const targetOut = getSelectedSheetContent();

      if (!selection || selection.isCollapsed || !targetOut) {
        floatingToolbar.style.display = 'none';
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        floatingToolbar.style.display = 'flex';
        
        // Align center horizontally above selection
        const leftPos = window.scrollX + rect.left + (rect.width / 2) - (floatingToolbar.offsetWidth / 2);
        const topPos = window.scrollY + rect.top - floatingToolbar.offsetHeight - 8;
        
        floatingToolbar.style.left = Math.max(10, leftPos) + 'px';
        floatingToolbar.style.top = topPos + 'px';

        // Update the size indicator for the current selection
        const parent = range.commonAncestorContainer.parentElement;
        const currentSize = parent ? parseInt(window.getComputedStyle(parent).fontSize) : parseInt(state.size);
        const floatSizeVal = document.getElementById('float-size-val');
        if (floatSizeVal) floatSizeVal.textContent = currentSize;
      } catch (err) {
        floatingToolbar.style.display = 'none';
      }
    });
  }

  // Initialize
  loadSavedState();
  updateControlsUI();
  initAddPageStrip();
  restoreExtraPages();
  render();
  setActivePage(0, true);

  // Wire Page 1 label for inline rename
  const page1TitleSpan = document.getElementById('page-1-title-span');
  if (page1TitleSpan) {
    const titleTextEl = page1TitleSpan.querySelector('.page-title-text');
    if (titleTextEl) titleTextEl.textContent = state.page1Title || 'Page 1';
    makePageLabelEditable(
      page1TitleSpan,
      () => state.page1Title,
      (t) => { state.page1Title = t; }
    );
  }

  // ── Expose Editor API for external modules (slicer.js, etc.) ──
  window.inkflow = {
    getState:            () => state,
    render,
    saveState,
    insertPageAfterBlock,
    renumberPages,
    syncExtraPagesStyle,
    setActivePage,
    updatePageSelectDropdown,
    formatMarkdownToHTML,
    getPaperWorkspace:   () => paperWorkspace,
    getPaperSheet:       () => paperSheet,
    getPaperOut:         () => paperOut,
    getTxt:              () => txt,
  };
});
