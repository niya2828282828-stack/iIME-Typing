const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
if (searchInput) {
    searchInput.style.backgroundColor = 'transparent';
    searchInput.style.borderColor = '#8ab4f8';
    searchInput.style.borderWidth = '2px';
    searchInput.style.boxShadow = '0 0 8px rgba(138, 180, 248, 0.5)';
    searchInput.style.transition = 'border-color 0.2s, box-shadow 0.2s';
}

const glowStyle = document.createElement('style');
glowStyle.textContent = `
  @keyframes glowEffect {
    0% {
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.5);
      border-color: #ffffff;
    }
    100% {
      box-shadow: 0 0 8px rgba(138, 180, 248, 0.5);
      border-color: #8ab4f8;
    }
  }
  .glow-flash {
    animation: glowEffect 0.4s ease-out;
 }
`;
document.head.appendChild(glowStyle);

window.triggerGlow = function(element) {
  if (!element) return;
  element.classList.remove('glow-flash');
 void element.offsetWidth;
  element.classList.add('glow-flash');
};