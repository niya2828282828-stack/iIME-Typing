// --- 問題データ設定 ---
const PROBLEMS = {
  easy: [
    "ねこ",
    "さくら",
    "宇宙人"
  ],
  normal: [
    "我々は宇宙人だ",
    "自作IMEのテストを行う",
    "タイピングゲームで変換精度を確かめる"
  ]
};

// 状態管理
let currentMode = 'free';
let currentIndex = 0;
let startTime = 0;

// UI要素の取得
let screenMenu, screenGame, screenResult;
let targetTextEl, inputEl, badgeEl, progressEl, finalTimeEl;

// ページ読み込み完了後にイベントを設定
document.addEventListener('DOMContentLoaded', () => {
  screenMenu = document.getElementById('screen-menu');
  screenGame = document.getElementById('screen-game');
  screenResult = document.getElementById('screen-result');

  targetTextEl = document.getElementById('target-text');
  inputEl = document.getElementById('typing-input');
  badgeEl = document.getElementById('game-mode-badge');
  progressEl = document.getElementById('game-progress');
  finalTimeEl = document.getElementById('final-time');

  // 入力判定処理
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (currentMode === 'free') return;

        const target = PROBLEMS[currentMode][currentIndex];
        const currentInput = inputEl.value.trim();

        if (currentInput === target) {
          currentIndex++;
          if (currentIndex < PROBLEMS[currentMode].length) {
            updateProblem();
          } else {
            const endTime = performance.now();
            const clearTime = ((endTime - startTime) / 1000).toFixed(2);
            finalTimeEl.textContent = clearTime;
            showScreen(screenResult);
          }
        }
      }
    });
  }
});

// 画面切替関数
function showScreen(screen) {
  if (!screenMenu || !screenGame || !screenResult) return;
  screenMenu.classList.remove('active');
  screenGame.classList.remove('active');
  screenResult.classList.remove('active');
  screen.classList.add('active');
}

function showMenu() {
  showScreen(screenMenu);
}

// ゲーム開始
function startGame(mode) {
  currentMode = mode;
  currentIndex = 0;

  if (!inputEl) {
    inputEl = document.getElementById('typing-input');
  }
  
  if (inputEl) {
    inputEl.value = '';
  }

  if (mode === 'free') {
    if (badgeEl) badgeEl.textContent = '自由入力';
    if (progressEl) progressEl.textContent = '試し打ち';
    if (targetTextEl) targetTextEl.textContent = '好きな文字を入力してキー操作を試せます';
    showScreen(screenGame);
    setTimeout(() => inputEl && inputEl.focus(), 100);
    return;
  }

  if (badgeEl) badgeEl.textContent = mode.toUpperCase();
  startTime = performance.now();
  updateProblem();
  showScreen(screenGame);
  setTimeout(() => inputEl && inputEl.focus(), 100);
}

// お題更新
function updateProblem() {
  const list = PROBLEMS[currentMode];
  if (progressEl) progressEl.textContent = `第 ${currentIndex + 1} / ${list.length} 問`;
  if (targetTextEl) targetTextEl.textContent = list[currentIndex];
  if (inputEl) inputEl.value = '';
}