// src/js/app.js

// お題（元の順番・内容をそのまま保持）
const PROBLEMS = {
  easy: [
    "こんにちは",
    "猫",
    "桜",
    "宇宙人",
    "hello"
  ],
  normal: [
    "hello world",
    "我々は宇宙人だ",
    "Hello World",
    "今日はいい天気ですね",
    "こんにちは世界！こんにちはhello"
  ]
};

// 状態管理
let currentMode = 'easy';
let currentPhase = 'standard'; // 'standard' (標準) または 'iime'
let currentIndex = 0;
let startTime = 0;

let standardTimeResult = 0;
let iimeTimeResult = 0;

// UI要素
let screenMenu, screenCountdown, screenGame, screenResult;
let targetTextEl, gameInputEl, homeInputEl, badgeEl, progressEl;
let toastEl, homeCardEl, kbdEnterEl;
let countdownMsgEl, countdownNumberEl, countdownBadgeEl;
let standardTimeEl, iimeTimeEl, diffMessageEl, gameHintsEl;

// ★ 入力欄発光エフェクト関数（オレンジ発光）
window.triggerGlow = function(element) {
  if (!element) return;
  element.classList.remove('glow-active', 'glow-flash');
  void element.offsetWidth; // リフロー強制でアニメーション再起動
  element.classList.add('glow-active');
};

// 画面切替
function showScreen(screen) {
  if (!screenMenu || !screenCountdown || !screenGame || !screenResult) return;
  screenMenu.classList.remove('active');
  screenCountdown.classList.remove('active');
  screenGame.classList.remove('active');
  screenResult.classList.remove('active');
  screen.classList.add('active');
}

// ホーム画面に戻る（自由入力は iIME 有効）
function showMenu() {
  window.isImeEnabled = true;
  showScreen(screenMenu);
  if (!homeInputEl) homeInputEl = document.getElementById('home-typing-input');
  if (homeInputEl) {
    homeInputEl.classList.add('ime-enabled');
    homeInputEl.value = '';
    // ホーム画面でも半角入力を強制
    homeInputEl.setAttribute('inputmode', 'url');
    homeInputEl.setAttribute('autocomplete', 'off');
    homeInputEl.setAttribute('autocapitalize', 'off');
    homeInputEl.setAttribute('spellcheck', 'false');
    setTimeout(() => homeInputEl.focus(), 100);
  }
}

// チャレンジモード開始
function startChallenge(mode) {
  currentMode = mode;
  currentPhase = 'standard';
  
  showCountdownScreen(
    "標準入力フェーズ",
    "最初は標準の入力で開始されます。",
    () => startPhase('standard')
  );
}

function showCountdownScreen(badgeText, msgText, onComplete) {
  showScreen(screenCountdown);
  if (countdownBadgeEl) countdownBadgeEl.textContent = badgeText;
  if (countdownMsgEl) countdownMsgEl.textContent = msgText;

  let count = 3;
  if (countdownNumberEl) countdownNumberEl.textContent = count;

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      if (countdownNumberEl) countdownNumberEl.textContent = count;
    } else {
      clearInterval(timer);
      onComplete();
    }
  }, 1000);
}

// フェーズ切り替え処理
// src/js/app.js の startPhase 部分

function startPhase(phase) {
  currentPhase = phase;
  currentIndex = 0;

  if (!gameInputEl) gameInputEl = document.getElementById('game-typing-input');
  if (gameInputEl) {
    gameInputEl.value = '';
    // 余計な inputmode は削除してクリアにします
    gameInputEl.removeAttribute('inputmode');
  }

  if (typeof clearAllBuffers === 'function') clearAllBuffers();

  if (phase === 'iime') {
    window.isImeEnabled = true;
    gameInputEl.classList.add('ime-enabled');
    
    // ★ 入力欄に薄くヒントを表示する
    gameInputEl.placeholder = "※半角入力でお使いください";

    if (badgeEl) badgeEl.textContent = `${currentMode.toUpperCase()}（iIME 有効）`;
    if (gameHintsEl) {
      gameHintsEl.innerHTML = `
        <span class="hint-item"><kbd>Tab</kbd> 候補切替</span>
        <span class="hint-divider">•</span>
        <span class="hint-item"><kbd>Space</kbd> 変換確定</span>
        <span class="hint-divider">•</span>
        <span class="hint-item"><kbd>Enter</kbd> 回答確定</span>
      `;
    }
  } else {
    window.isImeEnabled = false;
    gameInputEl.classList.remove('ime-enabled');
    gameInputEl.placeholder = "ここに標準入力で入力";

    if (badgeEl) badgeEl.textContent = `${currentMode.toUpperCase()}（標準入力）`;
    if (gameHintsEl) {
      gameHintsEl.innerHTML = `
        <span class="hint-item"><kbd>Enter</kbd> 回答確定</span>
      `;
    }
  }

  startTime = performance.now();
  updateProblem();
  showScreen(screenGame);
  setTimeout(() => gameInputEl && gameInputEl.focus(), 100);
}

function updateProblem() {
  const list = PROBLEMS[currentMode];
  if (progressEl) progressEl.textContent = `第 ${currentIndex + 1} / ${list.length} 問`;
  if (targetTextEl) targetTextEl.textContent = list[currentIndex];
  if (gameInputEl) gameInputEl.value = '';
  if (typeof clearAllBuffers === 'function') clearAllBuffers();
}

// ★ 確定演出（パーティクル、飛んでいく文字、カードのインパクト）
function triggerCommitEffects(text, inputWrapperEl) {
  if (!text) return;

  if (kbdEnterEl) {
    kbdEnterEl.classList.add('kbd-active-flash');
    setTimeout(() => kbdEnterEl.classList.remove('kbd-active-flash'), 250);
  }

  const activeCard = inputWrapperEl ? inputWrapperEl.closest('.input-card') : homeCardEl;
  if (activeCard) {
    activeCard.classList.remove('card-enter-impact');
    void activeCard.offsetWidth;
    activeCard.classList.add('card-enter-impact');
  }

  if (inputWrapperEl) {
    const input = inputWrapperEl.querySelector('input');
    if (input) window.triggerGlow(input);
  }

  // 1. パーティクル演出
  if (inputWrapperEl) {
    const rect = inputWrapperEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const particleCount = 18;
    const colors = ['#ff5500', '#ff8c00', '#ffa500', '#d4a359', '#8c6d46'];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle-ball';

      const size = Math.floor(Math.random() * 9) + 6;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = color;
      particle.style.boxShadow = `0 0 10px ${color}`;

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.floor(Math.random() * 90) + 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 650);
    }
  }

  // 2. 飛んでいくテキスト＆トースト表示演出
  if (toastEl && inputWrapperEl) {
    const rect = inputWrapperEl.getBoundingClientRect();
    const flyingEl = document.createElement('div');
    flyingEl.className = 'flying-committed-text';
    flyingEl.textContent = `「${text}」`;
    
    flyingEl.style.left = `${rect.left + rect.width / 2}px`;
    flyingEl.style.top = `${rect.top + rect.height / 2}px`;
    flyingEl.style.transform = 'translate(-50%, -50%) scale(1)';
    document.body.appendChild(flyingEl);

    const toastRect = toastEl.getBoundingClientRect();
    const targetX = toastRect.left + toastRect.width / 2;
    const targetY = toastRect.top + toastRect.height / 2;

    requestAnimationFrame(() => {
      flyingEl.style.left = `${targetX}px`;
      flyingEl.style.top = `${targetY}px`;
      flyingEl.style.opacity = '0.3';
      flyingEl.style.transform = 'translate(-50%, -50%) scale(0.6)';
    });

    setTimeout(() => {
      flyingEl.remove();

      toastEl.innerHTML = `<span class="toast-label">確定結果</span> <span class="toast-text">「${text}」</span>`;
      toastEl.classList.add('visible');
      toastEl.classList.remove('toast-pop');
      void toastEl.offsetWidth;
      toastEl.classList.add('toast-pop');
    }, 450);
  }
}

function triggerErrorGlow(element) {
  if (!element) return;
  element.classList.remove('glow-error', 'glow-flash');
  void element.offsetWidth;
  element.classList.add('glow-error');
}

// ページ読み込み完了時
document.addEventListener('DOMContentLoaded', () => {
  screenMenu = document.getElementById('screen-menu');
  screenCountdown = document.getElementById('screen-countdown');
  screenGame = document.getElementById('screen-game');
  screenResult = document.getElementById('screen-result');

  targetTextEl = document.getElementById('target-text');
  gameInputEl = document.getElementById('game-typing-input');
  homeInputEl = document.getElementById('home-typing-input');
  badgeEl = document.getElementById('game-mode-badge');
  progressEl = document.getElementById('game-progress');

  toastEl = document.getElementById('committed-toast');
  homeCardEl = document.getElementById('home-card');
  kbdEnterEl = document.getElementById('kbd-enter');

  countdownMsgEl = document.getElementById('countdown-msg');
  countdownNumberEl = document.getElementById('countdown-number');
  countdownBadgeEl = document.getElementById('countdown-badge');

  standardTimeEl = document.getElementById('standard-time');
  iimeTimeEl = document.getElementById('iime-time');
  diffMessageEl = document.getElementById('diff-message');
  gameHintsEl = document.getElementById('game-hints');

  // 初期状態は自由入力用にiIME有効
  showMenu();

  // ホーム画面（自由入力）でのEnter確定演出
  if (homeInputEl) {
    homeInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = homeInputEl.value.trim();
        if (val !== '') {
          const wrapper = homeInputEl.closest('.input-wrapper');
          triggerCommitEffects(val, wrapper);
          homeInputEl.value = '';
        }
      }
    });
  }

  // ゲーム用入力判定処理
  if (gameInputEl) {
    gameInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const target = PROBLEMS[currentMode][currentIndex];
        const currentInput = gameInputEl.value.trim();

        if (currentInput === target) {
          const wrapper = gameInputEl.closest('.input-wrapper');
          triggerCommitEffects(currentInput, wrapper);

          currentIndex++;
          if (currentIndex < PROBLEMS[currentMode].length) {
            updateProblem();
          } else {
            const endTime = performance.now();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

            if (currentPhase === 'standard') {
              standardTimeResult = parseFloat(timeTaken);
              
              showCountdownScreen(
                "iIME 有効化フェーズ",
                `結果は ${standardTimeResult.toFixed(2)} 秒でした。次に iIME が有効になります！`,
                () => startPhase('iime')
              );
            } else {
              iimeTimeResult = parseFloat(timeTaken);

              if (standardTimeEl) standardTimeEl.textContent = standardTimeResult.toFixed(2);
              if (iimeTimeEl) iimeTimeEl.textContent = iimeTimeResult.toFixed(2);

              if (diffMessageEl) {
                const diff = (standardTimeResult - iimeTimeResult).toFixed(2);
                if (diff > 0) {
                  diffMessageEl.textContent = `iIMEのほうが ${diff} 秒速く入力できました！✨`;
                } else if (diff < 0) {
                  diffMessageEl.textContent = `標準入力のほうが ${Math.abs(diff)} 秒速かったです！`;
                } else {
                  diffMessageEl.textContent = `同点タイムでした！`;
                }
              }

              showScreen(screenResult);
            }
          }
        } else {
          triggerErrorGlow(gameInputEl);
        }
      }
    });
  }
});