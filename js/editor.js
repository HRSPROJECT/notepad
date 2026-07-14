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
  const btnList = document.getElementById('btn-list');
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
  const btnSaveLocal = document.getElementById('btn-save-local');
  
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
    boldWeight: 700,
    underlineThickness: 2,
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
      boldWeight: state.boldWeight,
      underlineThickness: state.underlineThickness,
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
      // Escape HTML to prevent XSS, then parse custom markdown
      let htmlContent = state.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Replace **bold** with <span>
      htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, `<span style="font-weight: ${state.boldWeight};">$1</span>`);

      // Replace __underline__ with <span>
      htmlContent = htmlContent.replace(/__(.*?)__/g, `<span style="text-decoration: underline; text-decoration-thickness: ${state.underlineThickness}px;">$1</span>`);

      paperOut.innerHTML = htmlContent;

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
            repeating-linear-gradient(to right, transparent 0px, transparent ${lineHeight - 1}px, ${lineColor} ${lineHeight - 1}px, ${lineColor} ${lineHeight}px),
            repeating-linear-gradient(to bottom, transparent 0px, transparent ${lineHeight - 1}px, ${lineColor} ${lineHeight - 1}px, ${lineColor} ${lineHeight}px)
          `;
          paperSheet.style.backgroundSize = `100% 100%`;
          paperSheet.style.backgroundPosition = '0 0';
        } else if (state.paperPreset === 'blank') {
          paperSheet.style.backgroundImage = 'none';
        } else {
          // Horizontal Lined Ruled Drawing
          // Fixed syntax for html2canvas compatibility
          paperSheet.style.backgroundImage = `repeating-linear-gradient(transparent 0px, transparent ${lineHeight - 1}px, ${lineColor} ${lineHeight - 1}px, ${lineColor} ${lineHeight}px)`;
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
            // It's a number list, increment the number
            const num = parseInt(bullet, 10);
            const separator = bullet.replace(/[0-9]/g, '');
            bullet = (num + 1) + separator;
          }

          const insertText = '\n' + indent + bullet + ' ';

          const newText = txt.value.substring(0, start) + insertText + txt.value.substring(txt.selectionEnd);
          txt.value = newText;
          state.text = newText;

          txt.setSelectionRange(start + insertText.length, start + insertText.length);

          render();
          saveState();
        }
      }
    });
  }

  // Wrap selected text in textarea
  function insertFormatting(prefix, suffix) {
    if (!txt) return;
    const start = txt.selectionStart;
    const end = txt.selectionEnd;
    const selectedText = txt.value.substring(start, end);
    const newText = txt.value.substring(0, start) + prefix + selectedText + suffix + txt.value.substring(end);

    txt.value = newText;
    state.text = newText;

    // Maintain selection roughly
    setTimeout(() => {
      txt.focus();
      txt.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);

    render();
    saveState();
  }

  if (btnBold) {
    btnBold.addEventListener('click', () => insertFormatting('**', '**'));
  }

  if (btnUnderline) {
    btnUnderline.addEventListener('click', () => insertFormatting('__', '__'));
  }

  // Format as list
  function formatAsList() {
    if (!txt) return;
    const start = txt.selectionStart;
    const end = txt.selectionEnd;

    // If text is selected, format the selected lines
    // Otherwise format all lines
    const targetText = (start !== end) ? txt.value.substring(start, end) : txt.value;

    if (!targetText.trim()) return;

    const lines = targetText.split('\n');
    let formattedLines = [];
    let counter = 1;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Skip empty lines or already numbered lines
      if (line.trim() === '') {
        formattedLines.push(line);
      } else if (line.match(/^(\s*)([0-9]+[.)]|\*|-|\+)\s+/)) {
        formattedLines.push(line);
      } else {
        formattedLines.push(`${counter}) ${line}`);
        counter++;
      }
    }

    const newSegment = formattedLines.join('\n');

    if (start !== end) {
      txt.value = txt.value.substring(0, start) + newSegment + txt.value.substring(end);
    } else {
      txt.value = newSegment;
    }

    state.text = txt.value;
    render();
    saveState();
  }

  if (btnList) {
    btnList.addEventListener('click', formatAsList);
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

  // Download Image Action
  async function downloadImage() {
    if (typeof html2canvas === 'undefined') {
      alert("Error: html2canvas library is not loaded.");
      return;
    }

    // Briefly hide the stamp controls if they are somehow visible during export
    const stampControls = document.getElementById('stamp-controls');
    const wasStampVisible = stampControls && stampControls.style.display !== 'none';
    if (wasStampVisible) stampControls.style.display = 'none';

    try {
      const canvas = await html2canvas(paperSheet, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'Inkflow_Note.png';
      a.click();
    } catch (e) {
      console.error("Failed to generate image", e);
      alert("Failed to generate image.");
    } finally {
      if (wasStampVisible) stampControls.style.display = 'block';
    }
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', downloadImage);
  }

  // Share Note Action
  async function shareNote() {
    if (typeof html2canvas === 'undefined') {
      alert("Error: html2canvas library is not loaded.");
      return;
    }

    try {
      const canvas = await html2canvas(paperSheet, { scale: 2, useCORS: true, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'Inkflow_Note.png', { type: 'image/png' });

        // Try using Web Share API if supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Inkflow Note',
              text: 'Here is my handwritten note!',
              files: [file]
            });
            return;
          } catch (err) {
            console.log('Share API failed or user cancelled', err);
          }
        } else {
           alert("Your browser does not support native file sharing. Use the Download Image option instead.");
        }
      }, 'image/png');
    } catch (e) {
      console.error("Failed to share image", e);
      alert("Failed to share image.");
    }
  }

  if (btnShare) {
    btnShare.addEventListener('click', shareNote);
  }

  // Clear workspace action (New Note)
  function clearWorkspace() {
    if (confirm('Are you sure you want to clear your notepad text to start a new note?')) {
      state.text = '';
      if (txt) txt.value = '';
      render();
      saveState();
    }
  }

  // Save locally as JSON Action
  function saveLocally() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'Inkflow_Note_Data.json';
    a.click();
  }

  if (btnSaveLocal) {
    btnSaveLocal.addEventListener('click', saveLocally);
  }

  if (btnClear) {
    btnClear.addEventListener('click', clearWorkspace);
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
      if (e.altKey) {
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
      else if (e.shiftKey) {
        // Ctrl + Shift + L : Numbered List
        if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          formatAsList();
        }
      }
      else {
        // Ctrl + B : Bold Text
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          insertFormatting('**', '**');
        }
        // Ctrl + U : Underline Text
        else if (e.key.toLowerCase() === 'u') {
          e.preventDefault();
          insertFormatting('__', '__');
        }
        // Ctrl + S : Download Image
        else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          downloadImage();
        }
      }
    }
  });

  // Initialize
  loadSavedState();
  updateControlsUI();
  render();
});
