// Handwriting Font List Data
const FONTS_DATA = [
  {
    name: 'Caveat',
    designer: 'Pablo Impallari',
    family: "'Caveat', cursive",
    style: 'Playful & Natural',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Nanum Pen Script',
    designer: 'Sandoll',
    family: "'Nanum Pen Script', cursive",
    style: 'Sharp & Stylish',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Kalam',
    designer: 'Indian Type Foundry',
    family: "'Kalam', cursive",
    style: 'Modern Ink Pen',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Architects Daughter',
    designer: 'Kimberly Geswein',
    family: "'Architects Daughter', cursive",
    style: 'Chalkboard / Sketch',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Patrick Hand',
    designer: 'Patrick Wagesreiter',
    family: "'Patrick Hand', cursive",
    style: 'Friendly Handwriting',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Indie Flower',
    designer: 'Kimberly Geswein',
    family: "'Indie Flower', cursive",
    style: 'Bubbly & Carefree',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Sacramento',
    designer: 'Astigmatic',
    family: "'Sacramento', cursive",
    style: 'Elegant Calligraphy',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Dancing Script',
    designer: 'Impallari Type',
    family: "'Dancing Script', cursive",
    style: 'Formal Script',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Pacifico',
    designer: 'Vernon Adams',
    family: "'Pacifico', cursive",
    style: 'Bold Retro Cursive',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Playwrite IN',
    designer: 'TypeTogether',
    family: '"Playwrite IN", cursive',
    style: 'Indian School Cursive',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Tillana',
    designer: 'Indian Type Foundry',
    family: "'Tillana', cursive",
    style: 'Flowing Calligraphic Script',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'Dekko',
    designer: 'Indian Type Foundry',
    family: "'Dekko', cursive",
    style: 'Casual Friendly Pen',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9'
  },
  {
    name: 'MyHandwriting',
    designer: 'Custom Font',
    family: "'MyHandwriting', cursive",
    style: '✍ Custom Handwriting',
    charMap: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0-9',
    isCustom: true
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const fontGrid = document.getElementById('font-grid');
  const previewInput = document.getElementById('preview-text');
  const searchInput = document.getElementById('search-font');

  // Default preview sentence
  const defaultText = "Pack my box with five dozen liquor jugs. The quick brown fox jumps over the lazy dog.";

  function renderFonts() {
    const filterText = searchInput.value.toLowerCase();
    const previewText = previewInput.value || defaultText;
    
    fontGrid.innerHTML = '';
    
    const filteredFonts = FONTS_DATA.filter(f => f.name.toLowerCase().includes(filterText) || f.style.toLowerCase().includes(filterText));
    
    if (filteredFonts.length === 0) {
      fontGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No fonts matching your search criteria.</div>`;
      return;
    }

    filteredFonts.forEach(font => {
      const card = document.createElement('div');
      card.className = 'font-card';
      
      const badgeStyle = font.isCustom
        ? 'background: linear-gradient(135deg,#7c3aed,#ec4899); color:#fff; border-radius: 8px; padding: 4px 10px; font-size:11px; font-weight:700;'
        : '';
      const badgeClass = font.isCustom ? '' : 'font-badge';

      card.innerHTML = `
        <div>
          <div class="font-info">
            <div>
              <h3 class="font-name">${font.name}</h3>
              <span class="font-designer">By ${font.designer}</span>
            </div>
            <span class="${badgeClass}" style="${badgeStyle}">${font.style}</span>
          </div>
          <div class="font-preview" style="font-family: ${font.family}; font-size: 24px;">${previewText}</div>
          <div class="font-character-map">${font.charMap}</div>
        </div>
        <div class="font-actions">
          <a href="editor.html?font=${encodeURIComponent(font.family)}" class="btn btn-primary font-btn"><i class="fa-solid fa-file-pen"></i> Use in Notepad</a>
        </div>
      `;
      
      fontGrid.appendChild(card);
    });
  }

  // Bind input listeners
  if (previewInput && searchInput && fontGrid) {
    previewInput.addEventListener('input', renderFonts);
    searchInput.addEventListener('input', renderFonts);
    renderFonts(); // Initial run
  }
});
