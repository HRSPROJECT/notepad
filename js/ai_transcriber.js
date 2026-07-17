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

      const systemPrompt = `You are an OCR and document formatting assistant specialized in handwritten medical purchase orders.

TASK:
Read the uploaded image carefully and convert it into structured text while preserving the original layout exactly.

RULES:
1. Identify every supplier/distributor heading.
2. Extract every medicine exactly as written. Do NOT correct spellings unless the text is unreadable.
3. Preserve strengths, dosage forms, pack sizes, company names, and remarks.
4. Company names in brackets such as (Alkem), (Cipla), (Dr. Reddy), (Nett), (Big), (Small), etc. must remain immediately after the medicine name exactly like the original. Never move them to a separate column.
5. Do not add or remove medicines.
6. Keep numbering starting from ① for each supplier.
7. If a Note section exists, copy it exactly.
8. Ignore stamps, page decorations, and ruled lines unless they contain readable text.
9. If any word is unclear, write [unclear] instead of guessing.
10. Output only the formatted text. No explanations.

FORMAT:

# Supplier Name

①   Quantity        Medicine Name (Remarks)
②   Quantity        Medicine Name (Remarks)
③   Quantity        Medicine Name (Remarks)

Example:

Sanjay Trading Company

①   6×6 Tab       Azicip 250mg
②   1×10 Tab      Cefix 200DT
③   2×100gm       Clocip Dusting Powder (Big)
④   6×4 Cap       Gemsoline DS 60K Cap
⑤   3×10 Tab      Olox-OZ
⑥   2×100ml       Phenseeyl-DX Cough-Syp
⑦   10×10 Tab     Powerflam-MR (Alkem)
⑧   3×10 Cap      Rabesee DSR Cap (Cipla)
⑨   3×10 Cap      Pantosec DSR

Note:
Please don't forget to upload bill on email because it takes so much time to feed it manually in the System. (Supply to Divakar.)

Kumar Pharmaceuticals

①   10×2×2 Tab    Crocin Advance 500mg
②   1×10×1 Tab    Thyrox 75mg
③   1×10 Cap      Vibact Cap
④   3Hx10's Cap   Doxt SL 100mg (Dr. Reddy) (Nett)
⑤   3×60gm        Candid Powder (Small) (Nett)

New Mahalaxmi Agency

①   1×40 Tab      Sutshekhar Ras (Baidyanath)
②   5×60ml        Mebarid Syp (Phyto)
③   2×50gm        Dikamali Churna (Pushparaj)
④   2×50gm        Jeshtamadh Churna (Pushparaj)

IMPORTANT:
- Keep remarks attached to the medicine name.
- Preserve spacing for readability.
- Never create a separate remarks column.
- Do not use markdown tables.
- Return plain text inside a code block only.`;

      if (isVisionModel) {
        contentPayload = [
          {
            type: 'text',
            text: systemPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: base64ImageStr
            }
          }
        ];
      } else {
        contentPayload = `${systemPrompt}\n\nHere is the base64-encoded image to transcribe:\n${base64ImageStr}`;
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
        let cleanText = transcribedText.trim();
        // Remove code block backticks if returned by the model
        cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
        if (editorTxt) {
          editorTxt.value = cleanText;
          // Dispatch synthetic input event to trigger render and state persistence
          editorTxt.dispatchEvent(new Event('input', { bubbles: true }));
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
