// Apply saved accent color on every page load
document.addEventListener('DOMContentLoaded', () => {
  const savedColor = localStorage.getItem('accentColor');
  if (savedColor) {
    document.getElementById('accent-style').textContent = `
      :root {
        --accent: ${savedColor};
        --accent-dark: ${adjustColor(savedColor, -30)};
      }
    `;
    // Also update color picker if we're on settings page
    const picker = document.getElementById('accent-color');
    if (picker) picker.value = savedColor;
  }
});

// Settings page logic
const applyBtn = document.getElementById('apply-color');
const resetBtn = document.getElementById('reset-color');
const colorInput = document.getElementById('accent-color');

if (applyBtn && colorInput) {
  applyBtn.addEventListener('click', () => {
    const color = colorInput.value;
    localStorage.setItem('accentColor', color);
    
    document.getElementById('accent-style').textContent = `
      :root {
        --accent: ${color};
        --accent-dark: ${adjustColor(color, -30)};
      }
    `;
  });

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('accentColor');
    location.reload();
  });
}

// Very simple darkening function (you can improve it)
function adjustColor(hex, percent) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  
  r = Math.max(0, Math.min(255, Math.round(r * (1 + percent/100))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 + percent/100))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 + percent/100))));
  
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
