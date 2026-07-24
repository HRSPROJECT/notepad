/**
 * Inkflow Saved Notes Manager
 * Handles: rendering the notes library, search/filter, delete, and loading into editor.
 */
document.addEventListener('DOMContentLoaded', () => {

  const NOTES_KEY = 'inkflow_saved_notes';

  const grid          = document.getElementById('notes-grid');
  const searchInput   = document.getElementById('notes-search');
  const sortSelect    = document.getElementById('notes-sort');
  const countBadge    = document.getElementById('notes-count');

  if (!grid) return; // Not on notes page

  // ── Data helpers ──────────────────────────────────────────────
  function loadNotes() {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error loading notes:', e);
      return [];
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function deleteNote(id) {
    const notes = loadNotes().filter(n => n.id !== id);
    saveNotes(notes);
    renderNotes();
  }

  // ── Time formatting ───────────────────────────────────────────
  function formatDate(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1)    return 'Just now';
    if (diffMins < 60)   return `${diffMins}m ago`;
    if (diffHours < 24)  return `${diffHours}h ago`;
    if (diffDays < 7)    return `${diffDays}d ago`;

    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Utility: extract font display name from CSS family string ─
  function getFontDisplayName(cssFamily) {
    const match = cssFamily.match(/['"]([^'"]+)['"]/);
    return match ? match[1] : cssFamily;
  }

  // ── Utility: get paper background style for mini preview ──────
  function getPaperStyle(note) {
    const lineH = note.lineHeight || 40;

    const bgMap = {
      ruled:   { bg: '#fdfdf7', line: '#e2e4d9' },
      legal:   { bg: '#fffdeb', line: '#e6e3c5' },
      grid:    { bg: '#fafafa', line: '#e2e8f0' },
      vintage: { bg: '#f2e6d0', line: '#d3c4a9' },
      blank:   { bg: '#ffffff', line: '' },
    };

    const preset = bgMap[note.paperPreset] || bgMap.ruled;

    let bgImage = 'none';
    if (preset.line && note.ruled !== false) {
      if (note.paperPreset === 'grid') {
        bgImage = `linear-gradient(to right, ${preset.line} 1px, transparent 1px), linear-gradient(to bottom, ${preset.line} 1px, transparent 1px)`;
      } else if (note.paperPreset !== 'blank') {
        bgImage = `linear-gradient(to bottom, transparent ${lineH - 1}px, ${preset.line} ${lineH - 1}px, ${preset.line} ${lineH}px)`;
      }
    }

    return {
      backgroundColor: preset.bg,
      backgroundImage: bgImage,
      backgroundSize: note.paperPreset === 'grid'
        ? `${lineH}px ${lineH}px`
        : `100% ${lineH}px`,
      backgroundPosition: note.paperPreset === 'grid' ? '0 0' : '0 8px',
      backgroundRepeat: 'repeat',
    };
  }

  // ── Render all notes ──────────────────────────────────────────
  function renderNotes() {
    const allNotes = loadNotes();
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sortBy = sortSelect ? sortSelect.value : 'newest';

    let filtered = query
      ? allNotes.filter(n => n.title.toLowerCase().includes(query) || n.text.toLowerCase().includes(query))
      : allNotes;

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.savedAt) - new Date(b.savedAt);
      if (sortBy === 'alpha')  return a.title.localeCompare(b.title);
      return new Date(b.savedAt) - new Date(a.savedAt); // newest first (default)
    });

    // Update badge count
    if (countBadge) {
      countBadge.textContent = `${allNotes.length} Note${allNotes.length !== 1 ? 's' : ''}`;
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      const emptyMsg = query
        ? `No notes matching "<strong>${query}</strong>".`
        : 'No saved notes yet. Go to the Notepad Workspace and save your first note!';

      grid.innerHTML = `
        <div class="notes-empty">
          <div class="notes-empty-icon"><i class="fa-solid fa-book-open"></i></div>
          <h3>${query ? 'No results found' : 'Your notebook is empty'}</h3>
          <p>${emptyMsg}</p>
          ${!query ? `<a href="editor.html" class="btn btn-primary" style="margin-top:8px;"><i class="fa-solid fa-pen-to-square"></i> Open Notepad</a>` : ''}
        </div>
      `;
      return;
    }

    filtered.forEach((note, i) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.style.animationDelay = `${i * 0.04}s`;

      const paperStyle = getPaperStyle(note);
      const paperInlineStyle = Object.entries(paperStyle)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');

      const previewText = (note.text || '').substring(0, 200);
      const fontDisplay = getFontDisplayName(note.font || "'Caveat', cursive");
      const ink = note.ink || '#1a2a6c';

      // Margin color from preset
      const marginColors = {
        ruled: '#d98ba0', legal: '#ea7085', vintage: '#c27c88', grid: '', blank: ''
      };
      const marginColor = marginColors[note.paperPreset] || '#d98ba0';
      const showMargin = note.margin !== false && marginColor;

      card.innerHTML = `
        <div class="note-card-paper" style="${paperInlineStyle}">
          ${showMargin ? `<div class="note-card-paper-margin" style="background-color:${marginColor};"></div>` : ''}
          <div class="note-card-paper-text" style="font-family:${note.font || "'Caveat', cursive"}; color:${ink}; font-size:${Math.min(note.size || 28, 18)}px; line-height:${note.lineHeight || 40}px;">${escapeHtml(previewText)}</div>
          <div class="note-card-fade" style="background: linear-gradient(transparent, ${paperStyle.backgroundColor});"></div>
        </div>
        <div class="note-card-meta">
          <div class="note-card-title" title="${escapeHtml(note.title)}">${escapeHtml(note.title)}</div>
          <div class="note-card-date"><i class="fa-regular fa-clock"></i> ${formatDate(note.savedAt)}</div>
          <div class="note-card-tags">
            <span class="note-tag tag-font"><i class="fa-solid fa-font" style="font-size:9px;"></i> ${escapeHtml(fontDisplay)}</span>
            <span class="note-tag">${escapeHtml(note.paperPreset || 'ruled')}</span>
            <span class="note-tag" style="background:${ink}20; color:${ink}; border-color:${ink}40;">
              <i class="fa-solid fa-droplet" style="font-size:9px;"></i> Ink
            </span>
          </div>
        </div>
        <div class="note-card-actions">
          <button class="btn-open-note" data-id="${note.id}">
            <i class="fa-solid fa-file-pen"></i> Open in Editor
          </button>
          <button class="btn-delete-note" data-id="${note.id}" title="Delete this note">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    // Attach action listeners
    grid.querySelectorAll('.btn-open-note').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.href = `editor.html?note=${encodeURIComponent(id)}`;
      });
    });

    grid.querySelectorAll('.btn-delete-note').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const note = loadNotes().find(n => n.id === id);
        const title = note ? `"${note.title}"` : 'this note';
        if (confirm(`Delete ${title}? This cannot be undone.`)) {
          deleteNote(id);
          showToast('Note deleted.', true);
        }
      });
    });
  }

  // ── HTML escape helper ────────────────────────────────────────
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // ── Toast ─────────────────────────────────────────────────────
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ── Event listeners ───────────────────────────────────────────
  if (searchInput) searchInput.addEventListener('input', renderNotes);
  if (sortSelect)  sortSelect.addEventListener('change', renderNotes);

  // ── Initial render ────────────────────────────────────────────
  renderNotes();
});
