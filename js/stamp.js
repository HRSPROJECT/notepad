/**
 * Inkflow Stamp Manager
 * Handles: template upload, multiple instances, positioning, rotate, size, opacity, persist.
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

  const stampControls   = document.getElementById('stamp-controls');
  const sizeSlider      = document.getElementById('stamp-size');
  const sizeVal         = document.getElementById('stamp-size-val');
  const opacitySlider   = document.getElementById('stamp-opacity');
  const opacityVal      = document.getElementById('stamp-opacity-val');
  const rotateBtn       = document.getElementById('stamp-rotate-btn');
  const removeBtn       = document.getElementById('stamp-remove-btn');
  const paperSheet      = document.getElementById('paper-sheet');

  if (!dropZone || !paperSheet) return; // not on editor page

  // ── Stamp State ───────────────────────────────────────────────
  let stampInstances = [];
  let selectedStampId = null;

  // ── Persistence helpers ───────────────────────────────────────
  const INSTANCES_KEY = 'inkflow_stamp_instances';
  const IMG_KEY       = 'inkflow_stamp_img';

  function saveStampInstances() {
    localStorage.setItem(INSTANCES_KEY, JSON.stringify(stampInstances));
  }

  function loadStampInstances() {
    try {
      const raw = localStorage.getItem(INSTANCES_KEY);
      if (raw) {
        stampInstances = JSON.parse(raw);
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
  }

  // ── Instance DOM Operations ───────────────────────────────────
  function createStampDOM(instance, dataUrl) {
    const img = document.createElement('img');
    img.className = 'stamp-overlay';
    img.src = dataUrl;
    img.setAttribute('data-id', instance.id);
    img.setAttribute('draggable', 'false');

    applyInstanceStyle(img, instance);
    paperSheet.appendChild(img);
  }

  function applyInstanceStyle(element, instance) {
    if (!element) return;
    element.style.left      = instance.x + 'px';
    element.style.top       = instance.y + 'px';
    element.style.width     = instance.size + 'px';
    element.style.height    = 'auto';
    element.style.opacity   = instance.opacity / 100;
    element.style.transform = `rotate(${instance.rotation}deg)`;
    element.style.display   = 'block';
  }

  function selectStamp(id) {
    selectedStampId = id;
    const instances = paperSheet.querySelectorAll('.stamp-overlay');
    instances.forEach(el => {
      if (el.getAttribute('data-id') === id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    const instance = stampInstances.find(inst => inst.id === id);
    if (instance) {
      if (sizeSlider) {
        sizeSlider.value = instance.size;
        sizeVal.textContent = instance.size;
      }
      if (opacitySlider) {
        opacitySlider.value = instance.opacity;
        opacityVal.textContent = instance.opacity;
      }
      if (stampControls) {
        stampControls.style.display = 'flex';
      }
    }
  }

  function deselectStamp() {
    selectedStampId = null;
    const instances = paperSheet.querySelectorAll('.stamp-overlay');
    instances.forEach(el => el.classList.remove('selected'));
    if (stampControls) {
      stampControls.style.display = 'none';
    }
  }

  function renderAllInstances() {
    // Clear existing stamps on paper
    const existing = paperSheet.querySelectorAll('.stamp-overlay');
    existing.forEach(el => el.remove());

    const savedImg = loadStampImage();
    if (savedImg && stampInstances.length > 0) {
      stampInstances.forEach(inst => {
        createStampDOM(inst, savedImg);
      });
    }
  }

  function showStampUI(dataUrl) {
    // Show in sidebar
    thumbImg.src = dataUrl;
    thumbImg.style.display = 'block';
    placeholder.style.display = 'none';
    if (templateActions) templateActions.style.display = 'flex';
  }

  // Hide stamp UI
  function hideStampUI() {
    thumbImg.style.display = 'none';
    placeholder.style.display = 'flex';
    if (templateActions) templateActions.style.display = 'none';
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

    // Auto-add first stamp instance for user convenience
    addNewStampInstance();
  }

  function addNewStampInstance() {
    const savedImg = loadStampImage();
    if (!savedImg) return;

    const newInstance = {
      id: 'stamp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      x: 60,
      y: 60,
      size: 120,
      opacity: 100,
      rotation: 0
    };

    stampInstances.push(newInstance);
    saveStampInstances();
    createStampDOM(newInstance, savedImg);
    selectStamp(newInstance.id);
  }

  // ── Drag & Drop Events ─────────────────────────────────────────
  dropZone.addEventListener('click', (e) => {
    // Clicking the template thumbnail/dropzone opens file picker if no image or click on dropzone
    uploadInput.click();
  });

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
      e.stopPropagation(); // Avoid triggering dropZone click
      addNewStampInstance();
    });
  }

  // Delete template button (Permanently removes all)
  if (deleteTempBtn) {
    deleteTempBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering dropZone click
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
        const el = paperSheet.querySelector(`.stamp-overlay[data-id="${selectedStampId}"]`);
        applyInstanceStyle(el, instance);
        saveStampInstances();
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
        const el = paperSheet.querySelector(`.stamp-overlay[data-id="${selectedStampId}"]`);
        applyInstanceStyle(el, instance);
        saveStampInstances();
      }
    });
  }

  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      if (!selectedStampId) return;
      const instance = stampInstances.find(inst => inst.id === selectedStampId);
      if (instance) {
        instance.rotation = (instance.rotation + 15) % 360;
        const el = paperSheet.querySelector(`.stamp-overlay[data-id="${selectedStampId}"]`);
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
          const el = paperSheet.querySelector(`.stamp-overlay[data-id="${selectedStampId}"]`);
          if (el) el.remove();
          deselectStamp();
        }
      }
    });
  }

  // ── Drag instances with Event Delegation ─────────────────────────
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  paperSheet.addEventListener('mousedown', e => {
    const target = e.target;
    if (target.classList.contains('stamp-overlay')) {
      e.preventDefault();
      const id = target.getAttribute('data-id');
      selectStamp(id);

      isDragging = true;
      target.classList.add('dragging');

      const rect = paperSheet.getBoundingClientRect();
      const instance = stampInstances.find(inst => inst.id === id);
      if (instance) {
        dragOffsetX = e.clientX - rect.left - instance.x;
        dragOffsetY = e.clientY - rect.top  - instance.y;
      }
    } else {
      // Clicked on paper but not on stamp, deselect
      deselectStamp();
    }
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging || !selectedStampId) return;
    const activeEl = paperSheet.querySelector(`.stamp-overlay[data-id="${selectedStampId}"]`);
    if (!activeEl) return;

    const rect = paperSheet.getBoundingClientRect();
    let newX = e.clientX - rect.left - dragOffsetX;
    let newY = e.clientY - rect.top  - dragOffsetY;

    // Clamp within paper bounds
    const maxX = paperSheet.offsetWidth  - activeEl.offsetWidth;
    const maxY = paperSheet.offsetHeight - activeEl.offsetHeight;
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
    isDragging = false;
    const activeEl = paperSheet.querySelector(`.stamp-overlay.dragging`);
    if (activeEl) {
      activeEl.classList.remove('dragging');
    }
    saveStampInstances();
  });

  // ── Touch drag support (mobile) ─────────────────────────────────
  paperSheet.addEventListener('touchstart', e => {
    const target = e.target;
    if (target.classList.contains('stamp-overlay')) {
      e.preventDefault();
      const id = target.getAttribute('data-id');
      selectStamp(id);

      isDragging = true;
      target.classList.add('dragging');

      const touch = e.touches[0];
      const rect  = paperSheet.getBoundingClientRect();
      const instance = stampInstances.find(inst => inst.id === id);
      if (instance) {
        dragOffsetX = touch.clientX - rect.left - instance.x;
        dragOffsetY = touch.clientY - rect.top  - instance.y;
      }
    } else {
      deselectStamp();
    }
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!isDragging || !selectedStampId) return;
    const activeEl = paperSheet.querySelector(`.stamp-overlay[data-id="${selectedStampId}"]`);
    if (!activeEl) return;

    const touch = e.touches[0];
    const rect  = paperSheet.getBoundingClientRect();
    let newX = touch.clientX - rect.left - dragOffsetX;
    let newY = touch.clientY - rect.top  - dragOffsetY;

    const maxX = paperSheet.offsetWidth  - activeEl.offsetWidth;
    const maxY = paperSheet.offsetHeight - activeEl.offsetHeight;
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
    isDragging = false;
    const activeEl = paperSheet.querySelector(`.stamp-overlay.dragging`);
    if (activeEl) {
      activeEl.classList.remove('dragging');
    }
    saveStampInstances();
  });

  // ── Global workspace clear event listener ─────────────────────
  document.addEventListener('inkflow-clear', () => {
    localStorage.removeItem(INSTANCES_KEY);
    stampInstances = [];
    renderAllInstances();
    deselectStamp();
  });

  // ── Init: restore saved state on page load ────────────────────
  function init() {
    const savedImg = loadStampImage();
    if (savedImg) {
      showStampUI(savedImg);
      loadStampInstances();
      renderAllInstances();
    }
  }

  init();
});
