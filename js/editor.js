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
  const customInk = document.getElementById('ink-custom');
  const paperSheet = document.getElementById('paper-sheet');
  const paperOut = document.getElementById('paper-out');
  const marginLine = document.getElementById('margin-line');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');
  const btnClear = document.getElementById('btn-clear');
  const btnPrint = document.getElementById('btn-print');
  
  // Preset elements
  const presetPaperButtons = document.querySelectorAll('[data-paper]');
  const presetInkButtons = document.querySelectorAll('[data-ink]');

  // Application State
  let state = {
    text: `6x6 Tab Azicip 250mg\n1x10 Tab Cefix 200DT\n2x100gm Clocip Dusting Powder (Big)\n6x4 Cap Gemsoline DS 60K Cap`,
    font: "'Caveat', cursive",
    size: 28,
    lineHeight: 40,
    letterSpacing: 0,
    wordSpacing: 0,
    ruled: true,
    margin: true,
    ink: '#1a2a6c', // Gel Blue default
    paperPreset: 'ruled' // classic lined default
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

    // Process URL search query parameters (e.g. from Font Gallery)
    const urlParams = new URLSearchParams(window.location.search);
    const fontParam = urlParams.get('font');
    if (fontParam) {
      state.font = decodeURIComponent(fontParam);
    }
  }

  // Save current state to local storage
  function saveState() {
    localStorage.setItem('inkflow_state', JSON.stringify({
      text: state.text,
      font: state.font,
      size: state.size,
      lineHeight: state.lineHeight,
      letterSpacing: state.letterSpacing,
      wordSpacing: state.wordSpacing,
      ruled: state.ruled,
      margin: state.margin,
      ink: state.ink,
      paperPreset: state.paperPreset
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

  // Draw paper and apply layouts dynamically
  function render() {
    const fontSize = parseInt(state.size);
    const lineHeight = parseInt(state.lineHeight);
    
    // Update labels
    if (sizeVal) sizeVal.textContent = fontSize;
    if (lhVal) lhVal.textContent = lineHeight;
    if (lsVal) lsVal.textContent = state.letterSpacing;
    if (wsVal) wsVal.textContent = state.wordSpacing;

    // Apply text content & fonts
    if (paperOut) {
      paperOut.textContent = state.text;
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
        lineColor = 'var(--paper-line-grid)';
      } else if (state.paperPreset === 'vintage') {
        paperBg = 'var(--paper-bg-vintage)';
        marginColor = 'var(--paper-margin-vintage)';
        lineColor = 'var(--paper-line-vintage)';
      } else if (state.paperPreset === 'blank') {
        paperBg = '#ffffff';
      }

      paperSheet.style.backgroundColor = paperBg;
      if (marginLine) {
        marginLine.style.backgroundColor = marginColor;
      }

      // Draw lines
      if (state.ruled) {
        if (state.paperPreset === 'grid') {
          // Grid/Graph lines drawing
          paperSheet.style.backgroundImage = `
            linear-gradient(to right, ${lineColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
          `;
          paperSheet.style.backgroundSize = `${lineHeight}px ${lineHeight}px`;
          paperSheet.style.backgroundPosition = '0 0';
        } else if (state.paperPreset === 'blank') {
          paperSheet.style.backgroundImage = 'none';
        } else {
          // Horizontal Lined Ruled Drawing
          paperSheet.style.backgroundImage = `repeating-linear-gradient(to bottom, transparent, transparent ${lineHeight - 1}px, ${lineColor} ${lineHeight}px)`;
          paperSheet.style.backgroundSize = '100% ' + lineHeight + 'px';
          paperSheet.style.backgroundPosition = '0 30px';
        }
      } else {
        paperSheet.style.backgroundImage = 'none';
      }
    }

    // Update stats counters
    updateStats();
  }

  function updateStats() {
    if (charCount && wordCount) {
      charCount.textContent = state.text.length;
      const words = state.text.trim().split(/\s+/).filter(w => w.length > 0);
      wordCount.textContent = words.length;
    }
  }

  // Attach event handlers
  if (txt) {
    txt.addEventListener('input', (e) => {
      state.text = e.target.value;
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
      state.size = parseInt(e.target.value);
      render();
      saveState();
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
      state.ink = e.target.value;
      // remove active classes on preset inks
      presetInkButtons.forEach(btn => btn.classList.remove('active'));
      render();
      saveState();
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
      state.ink = ink;
      if (customInk) customInk.value = ink;

      presetInkButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      render();
      saveState();
    });
  });

  // Clear workspace action
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your notepad text?')) {
        state.text = '';
        if (txt) txt.value = '';
        render();
        saveState();
      }
    });
  }

  // Print Action
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Initialize
  loadSavedState();
  updateControlsUI();
  render();
});
