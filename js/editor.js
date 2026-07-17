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
    const floatSizeVal = document.getElementById('float-size-val');
    if (floatSizeVal) floatSizeVal.textContent = fontSize;

    // Apply text content & fonts
    if (paperOut) {
      // Convert Markdown to spans, then safely sanitize all DOM nodes to prevent XSS
      let htmlContent = state.text
        .replace(/^(Date\s*:\s*[^\n]+)/im, '<span style="float: right;">$1</span>')
        .replace(/\*\*(.*?)\*\*/g, `<span style="font-weight: ${state.boldWeight};">$1</span>`)
        .replace(/__(.*?)__/g, `<span style="text-decoration: underline; text-decoration-thickness: ${state.underlineThickness}px;">$1</span>`);

      const tempSanitize = document.createElement('div');
      tempSanitize.innerHTML = htmlContent;

      function sanitizeDOM(node) {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          const child = node.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE) {
            const tagName = child.tagName.toLowerCase();
            if (tagName === 'span') {
              const styleAttr = child.getAttribute('style') || '';
              // strip all attributes to avoid onload/onclick hacks
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
              // Replace other non-permitted tags with text nodes (safely escapes them)
              const textNode = document.createTextNode(child.outerHTML);
              node.replaceChild(textNode, child);
            }
          }
        }
      }

      sanitizeDOM(tempSanitize);

      if (document.activeElement !== paperOut) {
        paperOut.innerHTML = tempSanitize.innerHTML;
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

  // Helper to check if selection is inside paper sheet
  function isSelectionInSheet() {
    const selection = window.getSelection();
    return paperOut && !selection.isCollapsed && paperOut.contains(selection.anchorNode);
  }

  // Helper to wrap formatting styles selection-specifically on the sheet
  function applyStyleToSelection(styleName, styleValue) {
    const selection = window.getSelection();
    if (selection.isCollapsed) return;

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

    paperOut.dispatchEvent(new Event('input')); // trigger sync
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
    btnBold.addEventListener('click', () => {
      if (isSelectionInSheet()) {
        document.execCommand('bold');
        paperOut.dispatchEvent(new Event('input'));
      } else {
        insertFormatting('**', '**');
      }
    });
  }

  if (btnUnderline) {
    btnUnderline.addEventListener('click', () => {
      if (isSelectionInSheet()) {
        document.execCommand('underline');
        paperOut.dispatchEvent(new Event('input'));
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
      const today = new Date();
      const dateStr = `Date: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      state.text = `${dateStr}\n\n`;
      if (txt) txt.value = state.text;
      render();
      saveState();
      document.dispatchEvent(new CustomEvent('inkflow-clear'));
    }
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
        const isBold = (node.style.fontWeight && (parseInt(node.style.fontWeight) >= 600 || node.style.fontWeight === 'bold')) || tagName === 'b' || tagName === 'strong';
        const isUnderline = node.style.borderBottom || node.style.textDecoration.includes('underline') || tagName === 'u';

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
      .join('\n')
      .replace(/\n\n+/g, '\n');
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
  
  if (floatingToolbar && paperOut) {
    // Prevent toolbar click from clearing text selection in paperOut
    floatingToolbar.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    // Bold click
    const floatBoldBtn = document.getElementById('float-bold');
    if (floatBoldBtn) {
      floatBoldBtn.addEventListener('click', () => {
        document.execCommand('bold');
        paperOut.dispatchEvent(new Event('input')); // trigger sync
      });
    }

    // Underline click
    const floatUnderlineBtn = document.getElementById('float-underline');
    if (floatUnderlineBtn) {
      floatUnderlineBtn.addEventListener('click', () => {
        document.execCommand('underline');
        paperOut.dispatchEvent(new Event('input')); // trigger sync
      });
    }

    // Size increment/decrement selection-specifically
    const floatSizeUp = document.getElementById('float-size-up');
    const floatSizeDown = document.getElementById('float-size-down');

    if (floatSizeUp) {
      floatSizeUp.addEventListener('click', () => {
        const selection = window.getSelection();
        if (selection.isCollapsed) return;
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
        if (selection.isCollapsed) return;
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

    // Detect selection change and position toolbar
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();

      if (selection.isCollapsed || !paperOut.contains(selection.anchorNode)) {
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
  render();
});
