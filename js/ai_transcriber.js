/**
 * Inkflow Groq AI Transcriber
 * Handles: direct base64 image capture, Groq API call, gpt-oss-120b completions, and editor updates.
 */
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput    = document.getElementById('ai-api-key');
  const modelInput     = document.getElementById('ai-model');
  const dropZone       = document.getElementById('ai-drop-zone');
  const fileInput      = document.getElementById('ai-image-input');
  const placeholder    = document.getElementById('ai-image-placeholder');
  const previewImg     = document.getElementById('ai-image-preview');
  const processBtn     = document.getElementById('btn-process-ai');
  const loadingIndicator = document.getElementById('ai-loading');
  const editorTxt      = document.getElementById('editor-txt');

  if (!dropZone || !processBtn) return;

  const API_KEY_STORAGE   = 'inkflow_groq_api_key';
  const MODEL_NAME_STORAGE = 'inkflow_groq_model_name';

  let base64ImageStr = '';

  // ── Load saved configurations ──────────────────────────────────
  function loadConfigs() {
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) apiKeyInput.value = savedKey;
  }

  // ── Save configurations ────────────────────────────────────────
  function saveConfigs() {
    localStorage.setItem(API_KEY_STORAGE, apiKeyInput.value.trim());
  }

  // ── Read file as base64 data URL ───────────────────────────────
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      base64ImageStr = await readFileAsDataUrl(file);
      previewImg.src = base64ImageStr;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';
    } catch (err) {
      console.error('Failed to load image:', err);
      alert('Failed to read image file.');
    }
  }

  // ── File Selection & Drag/Drop Events ──────────────────────────
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleImage(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
  });

  // ── Process with Groq AI ───────────────────────────────────────
  processBtn.addEventListener('click', async (e) => {
    e.stopPropagation();

    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim() || 'meta-llama/llama-4-scout-17b-16e-instruct';

    if (!apiKey) {
      alert('Please enter your Groq API key.');
      return;
    }

    if (!base64ImageStr) {
      alert('Please upload or drag an image first.');
      return;
    }

    // Save configuration settings
    saveConfigs();

    // Show loading, disable buttons
    processBtn.disabled = true;
    loadingIndicator.style.display = 'flex';

    try {
      const isVisionModel = model.toLowerCase().includes('vision') || model.toLowerCase().includes('scout');
      let contentPayload;

      if (isVisionModel) {
        contentPayload = [
          {
            type: 'text',
            text: `You are an expert medical OCR assistant. Your job is to transcribe the medicine list from the image and format it EXACTLY in the clean note order layout style shown.
Follow these rules:
1. Extract distributor/company titles (e.g., Sanjay Trading Company, Kumar Pharmaceuticals, New Mahalaxmi Agency) and format them clearly at the top of their respective sections.
2. Under each company/distributor, list each medicine line. Each line must extract the quantity/packaging prefix (e.g. "6x6 Tab", "1x10 Tab", "2x100gm", "10x2x2 Tab") followed by the medicine name and strength/details (e.g. "Azicip 250mg", "Crocin Advance 500mg").
3. Format lists under each company using circled numbers (①, ②, ③, ④, ⑤, ⑥, ⑦, ⑧, ⑨, ⑩...).
4. Include any notes (e.g. "Note: Please dont forget to upload bill...") or pharmacy details (e.g. "Jeevan Medico & Gen. Stores...").
5. Return ONLY the transcribed text. Do not wrap the text in markdown code blocks like \`\`\` or include any introduction or commentary.`
          },
          {
            type: 'image_url',
            image_url: {
              url: base64ImageStr
            }
          }
        ];
      } else {
        contentPayload = `You are an expert medical OCR assistant. Below is the base64-encoded image of the medicine list prescription:
${base64ImageStr}

Your job is to transcribe the medicine list from the image and format it EXACTLY in the clean note order layout style shown.
Follow these rules:
1. Extract distributor/company titles (e.g., Sanjay Trading Company, Kumar Pharmaceuticals, New Mahalaxmi Agency) and format them clearly at the top of their respective sections.
2. Under each company/distributor, list each medicine line. Each line must extract the quantity/packaging prefix (e.g. "6x6 Tab", "1x10 Tab", "2x100gm", "10x2x2 Tab") followed by the medicine name and strength/details (e.g. "Azicip 250mg", "Crocin Advance 500mg").
3. Format lists under each company using circled numbers (①, ②, ③, ④, ⑤, ⑥, ⑦, ⑧, ⑨, ⑩...).
4. Include any notes (e.g. "Note: Please dont forget to upload bill...") or pharmacy details (e.g. "Jeevan Medico & Gen. Stores...").
5. Return ONLY the transcribed text. Do not wrap the text in markdown code blocks like \`\`\` or include any introduction or commentary.`;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: contentPayload
            }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const transcribedText = data.choices[0]?.message?.content;

      if (transcribedText) {
        if (editorTxt) {
          editorTxt.value = transcribedText.trim();
          // Dispatch synthetic input event to trigger render and state persistence
          editorTxt.dispatchEvent(new Event('input'));
        }
        alert('Medicine list transcribed and formatted successfully!');
      } else {
        throw new Error('No transcription returned from the model.');
      }
    } catch (err) {
      console.error(err);
      alert(`Groq AI Error: ${err.message}`);
    } finally {
      processBtn.disabled = false;
      loadingIndicator.style.display = 'none';
    }
  });

  // Init
  loadConfigs();
});
