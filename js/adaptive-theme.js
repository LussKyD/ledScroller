
document.addEventListener('DOMContentLoaded', () => {
  const applyThemeAdaptation = () => {
    const isDark = document.body.classList.contains('dark');

    // Adapt all labels, inputs, and textareas
    document.querySelectorAll('.form-row label, .form-row textarea, .form-row input').forEach(el => {
      el.style.color = isDark ? '#f5f5f5' : '#111111';
      el.style.backgroundColor = isDark ? '#1f2937' : '#ffffff';
    });

    // Update button color to match selected LED color
    const ledColorInput = document.querySelector('input[type="color"]');
    const ledColor = ledColorInput ? ledColorInput.value : '#4F46E5';
    const button = document.querySelector('.button-primary');
    if (button) {
      button.style.backgroundColor = ledColor;
      const hex = ledColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      button.style.color = brightness > 150 ? '#000' : '#fff';
    }
  };

  // Observe color changes and theme toggle
  const observer = new MutationObserver(applyThemeAdaptation);
  observer.observe(document.body, { attributes: true, subtree: true });

  document.addEventListener('input', e => {
    if (e.target.type === 'color') applyThemeAdaptation();
  });

  document.addEventListener('click', e => {
    if (e.target.id === 'theme-toggle' || e.target.classList.contains('theme-toggle')) {
      setTimeout(applyThemeAdaptation, 150);
    }
  });

  applyThemeAdaptation();
});
