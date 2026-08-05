/**
 * Inkflow Stamp Manager
 * Handles: template upload, multiple instances across ALL pages,
 * positioning, rotate, size, opacity, persist.
 */
document.addEventListener('DOMContentLoaded', () => {

  // ── DOM refs ──────────────────────────────────────────────────
  const dropZone        = document.getElementById('stamp-drop-zone');
  const uploadInput     = document.getElementById('stamp-upload');
  const placeholder     = document.getElementById('stamp-placeholder');
  const thumbImg        = document.getElementById('stamp-preview-thumb');
  const templateActions = document.getElementById('stamp-template-actions');
  const addBtn          = document.getElementById('stamp-add-btn');
  const deleteTempBtn   = document.getElementById('stamp-delete-template-btn');
  const stampTargetBadge = document.getElementById('stamp-target-badge');

  const stampControls   = document.getElementById('stamp-controls');
  const sizeSlider      = document.getElementById('stamp-size');
  const sizeVal         = document.getElementById('stamp-size-val');
  const opacitySlider   = document.getElementById('stamp-opacity');
  const opacityVal      = document.getElementById('stamp-opacity-val');
  const rotateBtn       = document.getElementById('stamp-rotate-btn');
  const removeBtn       = document.getElementById('stamp-remove-btn');

  // Use paper-workspace for event delegation across all pages
  const paperWorkspace  = document.querySelector('.paper-workspace');

  if (!dropZone || !paperWorkspace) return; // not on editor page

  // ── Stamp State ───────────────────────────────────────────────
  let stampInstances = [];
  let selectedStampId = null;
  let activeSheetId   = 'sheet-main'; // default to page 1

  // Drag tracking
  let isDragging   = false;
  let dragOffsetX  = 0;
  let dragOffsetY  = 0;
  let dragSheetId  = null;

  // ── Persistence helpers ───────────────────────────────────────
  const INSTANCES_KEY = 'inkflow_stamp_instances';
  const IMG_KEY       = 'inkflow_stamp_img';
  const DEFAULTS_KEY  = 'inkflow_stamp_defaults'; // remembers last-used size & opacity

  // Default new-stamp settings (overridden by saved prefs)
  let stampDefaults = { size: 120, opacity: 100 };

  function saveStampDefaults() {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify(stampDefaults));
  }

  function loadStampDefaults() {
    try {
      const raw = localStorage.getItem(DEFAULTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        stampDefaults = { ...stampDefaults, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load stamp defaults:', e);
    }
  }

  function saveStampInstances() {
    localStorage.setItem(INSTANCES_KEY, JSON.stringify(stampInstances));
  }

  function loadStampInstances() {
    try {
      const raw = localStorage.getItem(INSTANCES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate old instances without sheetId → assign to sheet-main
        stampInstances = parsed.map(inst => ({ sheetId: 'sheet-main', ...inst }));
      }
    } catch (e) {
      console.error('Error loading stamp instances:', e);
      stampInstances = [];
    }
  }

  function saveStampImage(dataUrl) {
    try {
      localStorage.setItem(IMG_KEY, dataUrl);
    } catch (e) {
      console.warn('Stamp image too large to save in localStorage:', e.message);
    }
  }

  function loadStampImage() {
    return localStorage.getItem(IMG_KEY) || null;
  }

  function clearAllStampStorage() {
    localStorage.removeItem(INSTANCES_KEY);
    localStorage.removeItem(IMG_KEY);
    localStorage.removeItem(DEFAULTS_KEY);
  }

  // ── Sheet helpers ─────────────────────────────────────────────
  function getSheetById(sheetId) {
    return document.querySelector(`[data-sheet-id="${sheetId}"]`);
  }

  function getTargetSheet() {
    return getSheetById(activeSheetId) || document.getElementById('paper-sheet');
  }

  function getPageLabelForSheet(sheet) {
    if (!sheet) return 'Page 1';
    const block = sheet.closest('.page-block, .extra-page-block');
    if (!block) return 'Page 1';
    const titleText = block.querySelector('.page-title-text');
    return titleText ? titleText.textContent.trim() : 'Page';
  }

  function setActiveSheet(sheetEl) {
    const sheetId = sheetEl ? sheetEl.getAttribute('data-sheet-id') : 'sheet-main';
    if (!sheetId) return;
    activeSheetId = sheetId;
    updateTargetBadge();
  }

  function updateTargetBadge() {
    if (!stampTargetBadge) return;
    const sheet = getTargetSheet();
    const label = getPageLabelForSheet(sheet);
    stampTargetBadge.textContent = '\uD83D\uDCCC Stamping on: ' + label;
  }

  // ── Instance DOM Operations ───────────────────────────────────
  function createStampDOM(instance, dataUrl) {
    const targetSheet = getSheetById(instance.sheetId) || document.getElementById('paper-sheet');
    if (!targetSheet) return;

    const img = document.createElement('img');
    img.className = 'stamp-overlay';
    img.src = dataUrl;
    img.setAttribute('data-id', instance.id);
    img.setAttribute('draggable', 'false');

    applyInstanceStyle(img, instance);
    targetSheet.appendChild(img);
  }

  function applyInstanceStyle(element, instance) {
    if (!element) return;
    element.style.left      = instance.x + 'px';
    element.style.top       = instance.y + 'px';
    element.style.width     = instance.size + 'px';
    element.style.height    = 'auto';
    element.style.opacity   = instance.opacity / 100;
    element.style.transform = 'rotate(' + instance.rotation + 'deg)';
    element.style.display   = 'block';
  }

  function selectStamp(id) {
    selectedStampId = id;
    // Search across all sheets
    document.querySelectorAll('.stamp-overlay').forEach(el => {
      el.classList.toggle('selected', el.getAttribute('data-id') === id);
    });

    const instance = stampInstances.find(inst => inst.id === id);
    if (instance) {
      if (sizeSlider)    { sizeSlider.value = instance.size;       sizeVal.textContent = instance.size; }
      if (opacitySlider) { opacitySlider.value = instance.opacity; opacityVal.textContent = instance.opacity; }
      if (stampControls) stampControls.style.display = 'flex';
    }
  }

  function deselectStamp() {
    selectedStampId = null;
    document.querySelectorAll('.stamp-overlay').forEach(el => el.classList.remove('selected'));
    if (stampControls) stampControls.style.display = 'none';
  }

  function renderAllInstances() {
    // Clear stamps from every sheet
    document.querySelectorAll('.stamp-overlay').forEach(el => el.remove());

    const savedImg = loadStampImage();
    if (savedImg && stampInstances.length > 0) {
      stampInstances.forEach(inst => createStampDOM(inst, savedImg));
    }
  }

  function showStampUI(dataUrl) {
    thumbImg.src = dataUrl;
    thumbImg.style.display = 'block';
    placeholder.style.display = 'none';
    if (templateActions) templateActions.style.display = 'flex';
    if (stampTargetBadge) stampTargetBadge.style.display = 'flex';
    updateTargetBadge();
  }

  function hideStampUI() {
    thumbImg.style.display = 'none';
    placeholder.style.display = 'flex';
    if (templateActions) templateActions.style.display = 'none';
    if (stampTargetBadge) stampTargetBadge.style.display = 'none';
    deselectStamp();
  }

  // ── File upload / drop handlers ────────────────────────────────
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await readFileAsDataUrl(file);
    saveStampImage(dataUrl);
    showStampUI(dataUrl);
    addNewStampInstance();
  }

  function addNewStampInstance() {
    const savedImg = loadStampImage();
    if (!savedImg) return;

    const targetSheet = getTargetSheet();
    const sheetId     = targetSheet ? (targetSheet.getAttribute('data-sheet-id') || 'sheet-main') : 'sheet-main';

    const newInstance = {
      id:       'stamp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      sheetId,
      x:        60,
      y:        60,
      size:     stampDefaults.size,    // remembered from last edit
      opacity:  stampDefaults.opacity, // remembered from last edit
      rotation: 0
    };

    stampInstances.push(newInstance);
    saveStampInstances();
    createStampDOM(newInstance, savedImg);
    selectStamp(newInstance.id);
  }

  // ── Drag & Drop Events ─────────────────────────────────────────
  dropZone.addEventListener('click', () => uploadInput.click());

  uploadInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Add instance button
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addNewStampInstance();
    });
  }

  // Delete template button (removes all permanently)
  if (deleteTempBtn) {
    deleteTempBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete stamp template permanently and remove all instances from paper?')) {
        clearAllStampStorage();
        stampInstances = [];
        renderAllInstances();
        hideStampUI();
        uploadInput.value = '';
      }
    });
  }

  // ── Sidebar instance controls ──────────────────────────────────
  if (sizeSlider) {
    sizeSlider.addEventListener('input', () => {
      if (!selectedStampId) return;
      const instance = stampInstances.find(inst => inst.id === selectedStampId);
      if (instance) {
        instance.size = parseInt(sizeSlider.value);
        sizeVal.textContent = instance.size;
        const el = document.querySelector('.stamp-overlay[data-id="' + selectedStampId + '"]');
        applyInstanceStyle(el, instance);
        saveStampInstances();
        // Remember this size as the default for future new stamps
        stampDefaults.size = instance.size;
        saveStampDefaults();
      }
    });
  }

  if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
      if (!selectedStampId) return;
      const instance = stampInstances.find(inst => inst.id === selectedStampId);
      if (instance) {
        instance.opacity = parseInt(opacitySlider.value);
        opacityVal.textContent = instance.opacity;
        const el = document.querySelector('.stamp-overlay[data-id="' + selectedStampId + '"]');
        applyInstanceStyle(el, instance);
        saveStampInstances();
        // Remember this opacity as the default for future new stamps
        stampDefaults.opacity = instance.opacity;
        saveStampDefaults();
      }
    });
  }

  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      if (!selectedStampId) return;
      const instance = stampInstances.find(inst => inst.id === selectedStampId);
      if (instance) {
        instance.rotation = (instance.rotation + 15) % 360;
        const el = document.querySelector('.stamp-overlay[data-id="' + selectedStampId + '"]');
        applyInstanceStyle(el, instance);
        saveStampInstances();
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      if (!selectedStampId) return;
      if (confirm('Remove this stamp instance from the document?')) {
        const index = stampInstances.findIndex(inst => inst.id === selectedStampId);
        if (index !== -1) {
          stampInstances.splice(index, 1);
          saveStampInstances();
          const el = document.querySelector('.stamp-overlay[data-id="' + selectedStampId + '"]');
          if (el) el.remove();
          deselectStamp();
        }
      }
    });
  }

  // ── Mouse Drag on Workspace (Event Delegation) ─────────────────
  paperWorkspace.addEventListener('mousedown', e => {
    const target = e.target;

    // Clicked on a stamp overlay
    if (target.classList.contains('stamp-overlay')) {
      e.preventDefault();
      const id = target.getAttribute('data-id');
      selectStamp(id);
      isDragging  = true;
      target.classList.add('dragging');
      dragSheetId = (stampInstances.find(inst => inst.id === id) || {}).sheetId || 'sheet-main';

      const sheet = getSheetById(dragSheetId) || getTargetSheet();
      if (sheet) {
        const rect     = sheet.getBoundingClientRect();
        const instance = stampInstances.find(inst => inst.id === id);
        if (instance) {
          dragOffsetX = e.clientX - rect.left - instance.x;
          dragOffsetY = e.clientY - rect.top  - instance.y;
        }
      }
      return;
    }

    // Clicked on a paper sheet (but not stamp) → update active sheet & deselect
    const sheet = target.closest('.paper-sheet');
    if (sheet) {
      deselectStamp();
      setActiveSheet(sheet);
    }
  });

  // Track active sheet when focusing any page sheet via keyboard or click
  paperWorkspace.addEventListener('focusin', e => {
    const sheet = e.target.closest('.paper-sheet');
    if (sheet) {
      setActiveSheet(sheet);
    }
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging || !selectedStampId) return;
    const sheet    = getSheetById(dragSheetId) || getTargetSheet();
    const activeEl = sheet && sheet.querySelector('.stamp-overlay[data-id="' + selectedStampId + '"]');
    if (!activeEl || !sheet) return;

    const rect = sheet.getBoundingClientRect();
    let newX = e.clientX - rect.left - dragOffsetX;
    let newY = e.clientY - rect.top  - dragOffsetY;

    // Clamp within sheet bounds
    const maxX = sheet.offsetWidth  - activeEl.offsetWidth;
    const maxY = sheet.offsetHeight - activeEl.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    const instance = stampInstances.find(inst => inst.id === selectedStampId);
    if (instance) {
      instance.x = Math.round(newX);
      instance.y = Math.round(newY);
      activeEl.style.left = instance.x + 'px';
      activeEl.style.top  = instance.y + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging  = false;
    dragSheetId = null;
    document.querySelectorAll('.stamp-overlay.dragging').forEach(el => el.classList.remove('dragging'));
    saveStampInstances();
  });

  // ── Touch drag support (mobile) ─────────────────────────────────
  paperWorkspace.addEventListener('touchstart', e => {
    const target = e.target;
    if (target.classList.contains('stamp-overlay')) {
      e.preventDefault();
      const id = target.getAttribute('data-id');
      selectStamp(id);
      isDragging  = true;
      target.classList.add('dragging');
      dragSheetId = (stampInstances.find(inst => inst.id === id) || {}).sheetId || 'sheet-main';

      const sheet = getSheetById(dragSheetId) || getTargetSheet();
      if (sheet) {
        const touch = e.touches[0];
        const rect  = sheet.getBoundingClientRect();
        const instance = stampInstances.find(inst => inst.id === id);
        if (instance) {
          dragOffsetX = touch.clientX - rect.left - instance.x;
          dragOffsetY = touch.clientY - rect.top  - instance.y;
        }
      }
    } else {
      const sheet = target.closest('.paper-sheet');
      if (sheet) {
        deselectStamp();
        setActiveSheet(sheet);
      }
    }
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!isDragging || !selectedStampId) return;
    const sheet    = getSheetById(dragSheetId) || getTargetSheet();
    const activeEl = sheet && sheet.querySelector('.stamp-overlay[data-id="' + selectedStampId + '"]');
    if (!activeEl || !sheet) return;

    const touch = e.touches[0];
    const rect  = sheet.getBoundingClientRect();
    let newX = touch.clientX - rect.left - dragOffsetX;
    let newY = touch.clientY - rect.top  - dragOffsetY;

    const maxX = sheet.offsetWidth  - activeEl.offsetWidth;
    const maxY = sheet.offsetHeight - activeEl.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    const instance = stampInstances.find(inst => inst.id === selectedStampId);
    if (instance) {
      instance.x = Math.round(newX);
      instance.y = Math.round(newY);
      activeEl.style.left = instance.x + 'px';
      activeEl.style.top  = instance.y + 'px';
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging  = false;
    dragSheetId = null;
    document.querySelectorAll('.stamp-overlay.dragging').forEach(el => el.classList.remove('dragging'));
    saveStampInstances();
  });

  // ── Global workspace clear event listener ──────────────────────
  document.addEventListener('inkflow-clear', () => {
    localStorage.removeItem(INSTANCES_KEY);
    stampInstances = [];
    document.querySelectorAll('.stamp-overlay').forEach(el => el.remove());
    deselectStamp();
  });

  // Update badge when any page title is renamed
  document.addEventListener('inkflow-page-renamed', updateTargetBadge);

  // ── Init: restore saved state on page load ─────────────────────
  function init() {
    loadStampDefaults(); // restore last-used size & opacity before creating any instance
    const savedImg = loadStampImage();
    if (savedImg) {
      showStampUI(savedImg);
      loadStampInstances();
      // Small delay so restoreExtraPages() in editor.js can finish first,
      // restoring sheetIds before we render stamps.
      setTimeout(renderAllInstances, 200);
    } else {
      if (stampTargetBadge) stampTargetBadge.style.display = 'none';
    }
    updateTargetBadge();
  }

  init();
});
