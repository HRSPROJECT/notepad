/**
 * Inkflow Stamp Manager
 * Handles: upload, base64 storage, drag-to-position, resize, opacity, rotate, persist.
 * All state stored in localStorage under key 'inkflow_stamp'.
 * Image stored separately under 'inkflow_stamp_img' (base64) to keep state key small.
 */
document.addEventListener('DOMContentLoaded', () => {

  // ── DOM refs ──────────────────────────────────────────────────
  const dropZone       = document.getElementById('stamp-drop-zone');
  const uploadInput    = document.getElementById('stamp-upload');
  const placeholder    = document.getElementById('stamp-placeholder');
  const thumbImg       = document.getElementById('stamp-preview-thumb');
  const stampControls  = document.getElementById('stamp-controls');
  const stampImg       = document.getElementById('stamp-img');
  const paperSheet     = document.getElementById('paper-sheet');

  const sizeSlider     = document.getElementById('stamp-size');
  const sizeVal        = document.getElementById('stamp-size-val');
  const opacitySlider  = document.getElementById('stamp-opacity');
  const opacityVal     = document.getElementById('stamp-opacity-val');
  const rotateBtn      = document.getElementById('stamp-rotate-btn');
  const removeBtn      = document.getElementById('stamp-remove-btn');

  if (!dropZone || !stampImg || !paperSheet) return; // not on editor page

  // ── Stamp State ───────────────────────────────────────────────
  let stamp = {
    x: 60,          // left px inside paper-sheet
    y: 60,          // top px inside paper-sheet
    size: 120,       // width px
    opacity: 100,    // 0-100
    rotation: 0,     // degrees, multiple of 15
    hasImage: false
  };

  // ── Persistence helpers ───────────────────────────────────────
  const STATE_KEY = 'inkflow_stamp';
  const IMG_KEY   = 'inkflow_stamp_img';

  function saveStampState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(stamp));
  }

  function loadStampState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        stamp = { ...stamp, ...parsed };
      }
    } catch (e) { /* ignore corrupt data */ }
  }

  function saveStampImage(dataUrl) {
    try {
      localStorage.setItem(IMG_KEY, dataUrl);
    } catch (e) {
      // localStorage quota exceeded (large images) — still show in-session
      console.warn('Stamp image too large to save in localStorage:', e.message);
    }
  }

  function loadStampImage() {
    return localStorage.getItem(IMG_KEY) || null;
  }

  function clearStampStorage() {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(IMG_KEY);
  }

  // ── Apply visual state to the overlay img ────────────────────
  function applyStampStyle() {
    if (!stamp.hasImage) return;
    stampImg.style.left    = stamp.x + 'px';
    stampImg.style.top     = stamp.y + 'px';
    stampImg.style.width   = stamp.size + 'px';
    stampImg.style.height  = 'auto';
    stampImg.style.opacity = stamp.opacity / 100;
    stampImg.style.transform = `rotate(${stamp.rotation}deg)`;
    stampImg.style.display = 'block';

    // Update sidebar controls to match saved values
    if (sizeSlider)    sizeSlider.value    = stamp.size;
    if (sizeVal)       sizeVal.textContent  = stamp.size;
    if (opacitySlider) opacitySlider.value  = stamp.opacity;
    if (opacityVal)    opacityVal.textContent = stamp.opacity;
  }

  function showStampUI(dataUrl) {
    // Sidebar thumbnail
    thumbImg.src = dataUrl;
    thumbImg.style.display = 'block';
    placeholder.style.display = 'none';
    stampControls.style.display = 'flex';

    // Paper overlay
    stampImg.src = dataUrl;
    stamp.hasImage = true;
    applyStampStyle();
  }

  function hideStampUI() {
    thumbImg.style.display = 'none';
    placeholder.style.display = 'flex';
    stampControls.style.display = 'none';
    stampImg.style.display = 'none';
    stampImg.src = '';
    stamp.hasImage = false;
  }

  // ── Read uploaded file as base64 ──────────────────────────────
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
    // Reset position to sensible default when new image uploaded
    stamp.x = 60;
    stamp.y = 60;
    stamp.size = 120;
    stamp.opacity = 100;
    stamp.rotation = 0;
    saveStampState();
    showStampUI(dataUrl);
  }

  // ── Drop zone: click to open file dialog ─────────────────────
  dropZone.addEventListener('click', () => uploadInput.click());

  uploadInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  // Drag-and-drop image onto the drop zone
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

  // ── Sidebar controls ──────────────────────────────────────────
  if (sizeSlider) {
    sizeSlider.addEventListener('input', () => {
      stamp.size = parseInt(sizeSlider.value);
      sizeVal.textContent = stamp.size;
      applyStampStyle();
      saveStampState();
    });
  }

  if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
      stamp.opacity = parseInt(opacitySlider.value);
      opacityVal.textContent = stamp.opacity;
      applyStampStyle();
      saveStampState();
    });
  }

  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      stamp.rotation = (stamp.rotation + 15) % 360;
      applyStampStyle();
      saveStampState();
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      if (confirm('Remove the stamp from this document?')) {
        clearStampStorage();
        stamp = { x: 60, y: 60, size: 120, opacity: 100, rotation: 0, hasImage: false };
        hideStampUI();
        uploadInput.value = '';
      }
    });
  }

  // ── Drag stamp on paper (mouse) ───────────────────────────────
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  stampImg.addEventListener('mousedown', e => {
    if (!stamp.hasImage) return;
    e.preventDefault();
    isDragging = true;
    stampImg.classList.add('dragging');

    const rect = paperSheet.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left - stamp.x;
    dragOffsetY = e.clientY - rect.top  - stamp.y;
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const rect = paperSheet.getBoundingClientRect();
    let newX = e.clientX - rect.left - dragOffsetX;
    let newY = e.clientY - rect.top  - dragOffsetY;

    // Clamp within paper bounds
    const maxX = paperSheet.offsetWidth  - stampImg.offsetWidth;
    const maxY = paperSheet.offsetHeight - stampImg.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    stamp.x = Math.round(newX);
    stamp.y = Math.round(newY);
    stampImg.style.left = stamp.x + 'px';
    stampImg.style.top  = stamp.y + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    stampImg.classList.remove('dragging');
    saveStampState(); // persist final position
  });

  // ── Touch drag support (mobile) ───────────────────────────────
  stampImg.addEventListener('touchstart', e => {
    if (!stamp.hasImage) return;
    e.preventDefault();
    isDragging = true;
    stampImg.classList.add('dragging');
    const touch = e.touches[0];
    const rect  = paperSheet.getBoundingClientRect();
    dragOffsetX = touch.clientX - rect.left - stamp.x;
    dragOffsetY = touch.clientY - rect.top  - stamp.y;
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect  = paperSheet.getBoundingClientRect();
    let newX = touch.clientX - rect.left - dragOffsetX;
    let newY = touch.clientY - rect.top  - dragOffsetY;
    const maxX = paperSheet.offsetWidth  - stampImg.offsetWidth;
    const maxY = paperSheet.offsetHeight - stampImg.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    stamp.x = Math.round(newX);
    stamp.y = Math.round(newY);
    stampImg.style.left = stamp.x + 'px';
    stampImg.style.top  = stamp.y + 'px';
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    stampImg.classList.remove('dragging');
    saveStampState();
  });

  // ── Init: restore saved stamp on page load ────────────────────
  function init() {
    loadStampState();
    const savedImg = loadStampImage();
    if (savedImg && stamp.hasImage) {
      showStampUI(savedImg);
    }
  }

  init();
});
