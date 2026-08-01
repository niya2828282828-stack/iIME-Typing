// src/js/inputRouter.js

// 記号関連の内部ステートを完全初期化する共通ヘルパー関数
function resetSymbolState(state) {
  if (!state) return;
  state.activeBuffer = "";
  state.lastVisualLength = 0;
  state.candidateIndex = 0;
  state.symbolCount = 0;             // ★ これが残ると2回に1回奇数/偶数バグが起きる
  state.lastSymbolStrLength = 0;     // ★ 前回の記号長をリセット
  delete state.lastSymbolKey;
  delete state.symbolBaseBuffer;
  delete state.isSymbolStartFullWidth;
  delete state.isHyphenContinue;
}

document.addEventListener('keydown', (e) => {
  const target = e.target;

  // 1. 標準モード（またはiIME対象外）は完全スルー
  if (
    !target || 
    (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) ||
    window.isImeEnabled === false || 
    !target.classList.contains('ime-enabled')
  ) {
    return;
  }

  // Ctrl / Cmd ショートカットはスルー
  if (e.ctrlKey || e.metaKey) {
    return;
  }

  let key = "";
  if (e.code && e.code.startsWith("Key")) {
    key = e.code.replace("Key", "").toLowerCase();
  } else {
    key = e.key;
  }

  // Tabキー（候補選択）
  if (e.key === 'Tab' || e.code === 'Tab') {
    if (typeof systemState !== 'undefined' && systemState.activeBuffer.length > 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (typeof debounceTimer !== 'undefined') clearTimeout(debounceTimer);

      const currentKana = translateToJapanese(systemState.activeBuffer);
      if (typeof window.getKanjiCandidates === 'function') {
        const requestId = ++systemState.currentRequestId;
        window.getKanjiCandidates(currentKana).then(candidates => {
          if (requestId !== systemState.currentRequestId) return;
          if (candidates && candidates.length > 0) {
            if (systemState.lastVisualLength > 0) {
              deleteLeftText(target, systemState.lastVisualLength);
            }
            const nextCandidate = candidates[systemState.candidateIndex % candidates.length];
            systemState.candidateIndex++;
            insertText(target, nextCandidate);
            systemState.lastVisualLength = nextCandidate.length;
          }
        });
      }
    }
    return;
  }

  // スペースキー
  if (e.key === ' ') {
    if (typeof window.inputSpace === 'function') {
      window.inputSpace(e, target, debounceTimer, systemState);
    }
    return;
  }

  // Enterキー（確定処理）
  if (e.key === 'Enter') {
    if (window.triggerGlow) {
      window.triggerGlow(target);
    }
    if (typeof clearAllBuffers === 'function') clearAllBuffers();
    if (typeof systemState !== 'undefined') resetSymbolState(systemState);
    return;
  }

  // Backspaceキー（文字削除処理）
  if (e.key === 'Backspace') {
    if (typeof systemState !== 'undefined') {
      if (systemState.activeBuffer.length > 0) {
        systemState.activeBuffer = systemState.activeBuffer.slice(0, -1);
      }
      systemState.lastVisualLength = Math.max(0, systemState.lastVisualLength - 1);
      
      const domLength = target.value !== undefined ? target.value.length : (target.textContent || "").length;
      if (domLength <= 1) {
        resetSymbolState(systemState);
      }
    }
    return;
  }

  // 1文字の入力（a-z, 伸ばし棒, 記号など）
  if (key.length === 1 && key !== ' ') {
    e.preventDefault();

    // ★ 画面が0文字なら、記号のカウントや全トグルフラグを完全に初期化してからiIMEに渡す
    if (typeof systemState !== 'undefined' && systemState) {
      const domLength = target.value !== undefined ? target.value.length : (target.textContent || "").length;
      if (domLength === 0) {
        resetSymbolState(systemState);
      }
    }

    if (typeof window.inputBasicKeys === 'function') {
      window.inputBasicKeys(
        e, 
        key, 
        target, 
        typeof symbolPairs !== 'undefined' ? symbolPairs : {}, 
        typeof debounceTimer !== 'undefined' ? debounceTimer : null, 
        typeof systemState !== 'undefined' ? systemState : null
      );
    } else if (typeof handleCustomIME === 'function') {
      handleCustomIME(target, key);
    }
    return;
  }
}, true);