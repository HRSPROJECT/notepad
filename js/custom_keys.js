/**
 * Inkflow Custom Keys Replacement Manager
 * Automatically replaces user-defined triggers with replacements as they type in the notepad.
 */
document.addEventListener('DOMContentLoaded', () => {
  const txt = document.getElementById('editor-txt');
  const addBtn = document.getElementById('btn-add-ck');
  const triggerInput = document.getElementById('ck-trigger');
  const replacementInput = document.getElementById('ck-replacement');
  const keysListContainer = document.getElementById('custom-keys-list');

  if (!txt || !keysListContainer) return;

  const STORAGE_KEY = 'inkflow_custom_keys';

  // Default key mappings
  let customKeys = [
    { trigger: '*', replacement: 'x' }
  ];

  // Load from local storage
  function loadKeys() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        customKeys = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading custom keys:', e);
    }
  }

  // Save to local storage
  function saveKeys() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customKeys));
  }

  // Render list of custom keys in sidebar
  function renderKeysList() {
    keysListContainer.innerHTML = '';
    
    if (customKeys.length === 0) {
      keysListContainer.innerHTML = `
        <div style="font-size: 11px; color: var(--text-tertiary); text-align: center; padding: 8px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
          No custom keys added yet.
        </div>
      `;
      return;
    }

    customKeys.forEach((ck, index) => {
      const item = document.createElement('div');
      item.className = 'ck-item';
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 13px;
      `;
      item.innerHTML = `
        <span><code style="background: var(--bg-primary); padding: 2px 4px; border-radius: 3px; font-weight: 600;">${escapeHtml(ck.trigger)}</code> &rarr; <code style="background: var(--bg-primary); padding: 2px 4px; border-radius: 3px; font-weight: 600;">${escapeHtml(ck.replacement)}</code></span>
        <button class="btn-delete-ck" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 2px; font-size: 14px;"><i class="fa-solid fa-trash-can"></i></button>
      `;
      keysListContainer.appendChild(item);
    });

    // Attach delete listeners
    const deleteBtns = keysListContainer.querySelectorAll('.btn-delete-ck');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        customKeys.splice(index, 1);
        saveKeys();
        renderKeysList();
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Intercept notepad typing and perform replacements
  txt.addEventListener('input', (e) => {
    // Prevent infinite loops from synthetic events
    if (e.isTrusted === false) return;

    const start = txt.selectionStart;
    const value = txt.value;
    const textBeforeCursor = value.substring(0, start);

    for (const ck of customKeys) {
      if (ck.trigger && textBeforeCursor.endsWith(ck.trigger)) {
        // Replace trigger sequence with replacement text
        const prefix = textBeforeCursor.substring(0, textBeforeCursor.length - ck.trigger.length);
        const suffix = value.substring(txt.selectionEnd);
        const newValue = prefix + ck.replacement + suffix;

        txt.value = newValue;

        // Restore cursor position immediately after replacement
        const newCursorPos = prefix.length + ck.replacement.length;
        txt.setSelectionRange(newCursorPos, newCursorPos);

        // Dispatch synthetic input event so editor.js captures the update
        txt.dispatchEvent(new Event('input'));
        break;
      }
    }
  });

  // Handle adding new shortcut mappings
  if (addBtn && triggerInput && replacementInput) {
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trigger = triggerInput.value;
      const replacement = replacementInput.value;

      if (!trigger) {
        alert('Please enter a trigger sequence.');
        return;
      }

      // Check if trigger sequence already exists
      if (customKeys.some(ck => ck.trigger === trigger)) {
        alert('This trigger sequence already exists.');
        return;
      }

      customKeys.push({ trigger, replacement });
      saveKeys();
      renderKeysList();

      // Clear inputs
      triggerInput.value = '';
      replacementInput.value = '';
    });
  }

  // Init
  loadKeys();
  renderKeysList();
});
