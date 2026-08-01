// src/js/inputRouter.js

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

  // Enterキー（確定処理：確定時は画面の描画長も0にする）
  if (e.key === 'Enter') {
    if (window.triggerGlow) {
      window.triggerGlow(target);
    }
    if (typeof clearAllBuffers === 'function') {
      clearAllBuffers();
    } else if (typeof systemState !== 'undefined') {
      systemState.activeBuffer = "";
      systemState.lastVisualLength = 0;
    }
    return;
  }

  // Backspaceキー（削除処理：バッファと描画長を一緒に減算・クリアする）
  if (e.key === 'Backspace') {
    if (typeof systemState !== 'undefined') {
      if (systemState.activeBuffer.length > 0) {
        systemState.activeBuffer = systemState.activeBuffer.slice(0, -1);
      }
      systemState.lastVisualLength = Math.max(0, systemState.lastVisualLength - 1);
    }
    return;
  }

  // 1文字の入力（a-z, 伸ばし棒, 記号など）
  if (key.length === 1 && key !== ' ') {
    e.preventDefault();
    
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