const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
if (searchInput) {
    searchInput.style.backgroundColor = 'transparent';
    searchInput.style.borderColor = '#d46a00'; // 通常時も少し落ち着いたオレンジ枠線に
    searchInput.style.borderWidth = '2px';
    searchInput.style.boxShadow = '0 0 8px rgba(212, 106, 0, 0.4)';
    searchInput.style.transition = 'border-color 0.2s, box-shadow 0.2s';
}

const glowStyle = document.createElement('style');
glowStyle.textContent = `
  @keyframes glowEffect {
    0% {
      /* 発光の最高潮：鮮やかな濃いオレンジで大きく包み込む */
      box-shadow: 0 0 25px rgba(255, 102, 0, 0.95), 0 0 10px rgba(255, 140, 0, 0.8), inset 0 0 12px rgba(255, 165, 0, 0.6);
      border-color: #ff5500;
      transform: scale(1.01); /* ほんの少しだけ膨らませて視認性をアップ */
    }
    50% {
      box-shadow: 0 0 18px rgba(255, 102, 0, 0.7), inset 0 0 6px rgba(255, 140, 0, 0.3);
      border-color: #ff7700;
    }
    100% {
      /* 元の待機状態へ */
      box-shadow: 0 0 8px rgba(212, 106, 0, 0.4);
      border-color: #d46a00;
      transform: scale(1);
    }
  }
  .glow-flash {
    animation: glowEffect 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
`;
document.head.appendChild(glowStyle);

window.triggerGlow = function(element) {
  if (!element) return;
  element.classList.remove('glow-flash');
  void element.offsetWidth; // リフロー発生でアニメーションリセット
  element.classList.add('glow-flash');
};