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

// DOM読み込み完了後に確実にイベントを登録
document.addEventListener('DOMContentLoaded', () => {
  const screenMenu = document.getElementById('screen-menu');
  const screenGame = document.getElementById('screen-game');
  const screenResult = document.getElementById('screen-result');

  const targetTextEl = document.getElementById('target-text');
  const inputEl = document.getElementById('typing-input');
  const badgeEl = document.getElementById('game-mode-badge');
  const progressEl = document.getElementById('game-progress');
  const finalTimeEl = document.getElementById('final-time');

  // 画面切替
  function showScreen(screen) {
    screenMenu.classList.remove('active');
    screenGame.classList.remove('active');
    screenResult.classList.remove('active');
    screen.classList.add('active');
  }

  // ゲーム開始処理
  function startGame(mode) {
    currentMode = mode;
    currentIndex = 0;
    inputEl.value = '';

    if (mode === 'free') {
      badgeEl.textContent = '自由入力';
      progressEl.textContent = '試し打ち';
      targetTextEl.textContent = '好きな文字を入力してキー操作を試せます';
      showScreen(screenGame);
      setTimeout(() => inputEl.focus(), 50);
      return;
    }

    badgeEl.textContent = mode.toUpperCase();
    startTime = performance.now();
    updateProblem();
    showScreen(screenGame);
    setTimeout(() => inputEl.focus(), 50);
  }

  // お題更新
  function updateProblem() {
    const list = PROBLEMS[currentMode];
    progressEl.textContent = `第 ${currentIndex + 1} / ${list.length} 問`;
    targetTextEl.textContent = list[currentIndex];
    inputEl.value = '';
  }

  // --- ボタンへの直接イベント割り当て ---
  // モード選択ボタン
  const modeButtons = document.querySelectorAll('#screen-menu .btn-mode');
  if (modeButtons.length >= 3) {
    modeButtons[0].addEventListener('click', () => startGame('free'));
    modeButtons[1].addEventListener('click', () => startGame('easy'));
    modeButtons[2].addEventListener('click', () => startGame('normal'));
  }

  // 戻るボタン
  const backBtn = document.querySelector('.btn-sub');
  if (backBtn) {
    backBtn.addEventListener('click', () => showScreen(screenMenu));
  }

  // リザルトのメニューに戻るボタン
  const resultMenuBtn = document.querySelector('#screen-result .btn-mode');
  if (resultMenuBtn) {
    resultMenuBtn.addEventListener('click', () => showScreen(screenMenu));
  }

  // 入力判定処理 (Enterキー押下時)
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
});