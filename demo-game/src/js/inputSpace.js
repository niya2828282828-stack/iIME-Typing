window.inputSpace = async function inputSpace(
  event, 
  activeElement, 
  debounceTimer,
  systemState
) {
    event.preventDefault();
    event.stopImmediatePropagation();

    clearTimeout(debounceTimer);

    systemState.symbolCount = 0;
    systemState.lastSymbolKey = "";
    const currentLastSymbolLen = systemState.lastSymbolStrLength;
    systemState.lastSymbolStrLength = 0;

    const requestId = ++systemState.currentRequestId;

    if (systemState.isEnglishModeActive) {
      systemState.isEnglishModeActive = false; // フラグを解除（これで通常モードに戻る）
      systemState.activeBuffer = "";
      systemState.lastVisualLength = 0;
      if (typeof window.triggerGlow === 'function') window.triggerGlow(activeElement);
      return; // 1回目はスペースを入れずに終了
    }

    if (systemState.activeBuffer.length === 0) {
      insertText(activeElement, " ");
      systemState.activeBuffer = "";
      systemState.lastVisualLength = 0;
      return;
    }

    // 1. 直前の文字状態を取得（入力中単語の直前がスペースか文頭か）
    const isEditable = activeElement.isContentEditable;
    const currentText = isEditable ? activeElement.textContent : activeElement.value;
    const currentPos = isEditable ? (window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : 0) : activeElement.selectionStart;
    const textBeforeWord = currentText.substring(0, currentPos - systemState.lastVisualLength);
    const isPrevSpace = textBeforeWord.length === 0 || textBeforeWord.endsWith(" ") || textBeforeWord.endsWith("\n");
    let foundEngWord = "";
    let jpPartBuffer = "";

    const baseBuffer = systemState.activeBuffer.substring(0, systemState.activeBuffer.length - currentLastSymbolLen);
    const symbolSuffix = systemState.activeBuffer.substring(systemState.activeBuffer.length - currentLastSymbolLen);

    if (typeof englishWords !== 'undefined') {
      // 後ろから長い順に辞書とマッチするか検索
      for (let i = 0; i < systemState.activeBuffer.length; i++) {
        const sub = systemState.activeBuffer.substring(i).toLowerCase();
        const minLength = (i === 0) ? 1 : 3;
      if (sub.length >= minLength && sub !== 'you' && englishWords.includes(sub)) {
          foundEngWord = sub;
          jpPartBuffer = systemState.activeBuffer.substring(0, i); // 英単語より前の部分
          break;
        }
      }
    }
    // 2. 「最初が大文字」または「前がスペース ＆ 辞書にある英単語」か判定
    const isStartWithUpper = /^[A-Z]/.test(systemState.activeBuffer);
    const isNotJapanese = baseBuffer.length > 0 && translateToJapanese(baseBuffer) === baseBuffer;
    const isEnglishDict = typeof englishWords !== 'undefined' && englishWords.includes(systemState.activeBuffer.toLowerCase());
    const currentVisualLen = systemState.lastVisualLength;
    const isFirstSpace = systemState.activeBuffer.length > 0;

    // バッファ内に英単語が見つかった場合（直前スペースがなくても判定） ---
    if (foundEngWord.length > 0) {
      // 画面上の未確定テキストを削除
      deleteLeftText(activeElement, systemState.lastVisualLength);

      // 前半の日本語部分があれば変換（無ければ空文字）
      const jpKana = jpPartBuffer ? translateToJapanese(jpPartBuffer) : "";
     let jpConverted = jpKana;
     if (jpKana.length > 0 && typeof window.getKanjiCandidates === 'function') {
       const candidates = await window.getKanjiCandidates(jpKana);
       if (candidates && candidates.length > 0) jpConverted = candidates[0];
     }
     if (requestId !== systemState.currentRequestId) return;
      // 日本語部分 + 検出された英単語 を結合して挿入
      const resultText = jpConverted + foundEngWord;
      insertText(activeElement, resultText + (isFirstSpace ? "" : " "));

      systemState.activeBuffer = "";
      systemState.lastVisualLength = 0;
      if (typeof window.triggerGlow === 'function') window.triggerGlow(activeElement);
    }

    else if ((isStartWithUpper || (isPrevSpace && isEnglishDict) || isNotJapanese) && systemState.activeBuffer.length > 0) {

      deleteLeftText(activeElement, systemState.lastVisualLength);

      // 1回目(確定のみ)ならスペースを追加せず、2回目以降ならスペースを追加
      insertText(activeElement, systemState.activeBuffer + (isFirstSpace ? "" : " "));

      systemState.activeBuffer = "";
      systemState.lastVisualLength = 0;
      if (typeof window.triggerGlow === 'function') window.triggerGlow(activeElement);

    } else {
      const rawHiragana = translateToJapanese(systemState.activeBuffer) + symbolSuffix;
      const targetElement = activeElement;

      // 1回目(確定のみ)ならスペースを追加せず、2回目以降ならスペースを追加
      const appendSpace = isFirstSpace ? "" : " ";


      if (isFirstSpace) {
        // 未確定文字がある場合（1回目：確定処理）
        if (systemState.lastVisualLength > 0 && typeof window.triggerGlow === 'function') window.triggerGlow(targetElement);

        systemState.activeBuffer = "";
        systemState.lastVisualLength = 0;

        if (appendSpace) {
          insertText(targetElement, appendSpace);
        }
      } else {
        // すでに確定済みの場合（2回目以降：スペース入力）
        insertText(targetElement, " ");
        systemState.activeBuffer = "";
        systemState.lastVisualLength = 0;
      }
    }
}