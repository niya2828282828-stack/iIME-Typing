window.inputBasicKeys = async function inputBasicKeys(
  event, 
  key, 
  activeElement,
  symbolPairs,
  debounceTimer,
  systemState
) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const isEditable = activeElement.isContentEditable;
    const text = isEditable ? activeElement.textContent : activeElement.value;
    const selStart = isEditable ? (window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : 0) : activeElement.selectionStart;

    // 現在入力中の単語の「開始位置」を探す
    let wordStart = selStart;
    while (wordStart > 0 && text[wordStart - 1] !== ' ' && text[wordStart - 1] !== '\n') {
      wordStart--;
    }

    // 現在入力中の単語を切り出す
    const currentWord = text.substring(wordStart, selStart);

    const isEnglishWordMode = (event.shiftKey && !symbolPairs[key]) || systemState.isEnglishModeActive;

    const isNumber = key.match(/^[0-9]$/);
    const currentSymbolSymbolKey = key === '-' ? '-' : ((event.shiftKey ? 'Shift+' : '') + key);

   

    // 英単語モードの場合の処理
    if (isEnglishWordMode) {
      // Shiftありなら大文字、なしなら小文字にする
      const targetKey = event.shiftKey ? key.toUpperCase() : key.toLowerCase();

      activeElement.spellcheck = false;

      activeElement.value = text.substring(0, selStart) + targetKey + text.substring(activeElement.selectionEnd);

      // カーソル位置を1文字進める
      const newPos = selStart + 1;
      activeElement.setSelectionRange(newPos, newPos);

      lastVisualLength = 0;
      systemState.activeBuffer = "";
      systemState.isEnglishModeActive = true;
    }
 


    else if ((symbolPairs[key] && key in symbolPairs) || isNumber) {

      
      
     const baseBufferPrev = systemState.activeBuffer.substring(0, systemState.activeBuffer.length - systemState.lastSymbolStrLength);
     
    if (baseBufferPrev.length > 0 && /^[a-zA-Z]+$/.test(baseBufferPrev) && key === '-') {
        handleCustomIME(activeElement, key);
        return;
     }


      if (isNumber && baseBufferPrev.length > 0) {
        if (typeof window.triggerGlow === 'function') window.triggerGlow(activeElement);
        systemState.activeBuffer = "";
        systemState.lastVisualLength = 0;
      }

     if (currentSymbolSymbolKey !== systemState.lastSymbolKey) {

      const isEditable = activeElement.isContentEditable;
       const textVal = isEditable ? activeElement.textContent : activeElement.value;
       const currentPos = isEditable ? (window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : 0) : activeElement.selectionStart;
       const textBefore = textVal.substring(0, currentPos);
       const lastChar = textBefore.length > 0 ? textBefore[textBefore.length - 1] : "";

       // 直前文字が全角長音「ー」で、伸ばし棒キー（`-`）が押された場合は「連打2回目」としてトグルへ引き継ぐ
       if (lastChar === 'ー' && key === '-') {
         systemState.symbolCount = 0;
         systemState.lastSymbolStrLength = 1;
         systemState.lastVisualLength = 1;
         systemState.symbolBaseBuffer = "";
         systemState.lastSymbolKey = currentSymbolSymbolKey;
         systemState.isSymbolStartFullWidth = true;
         systemState.isHyphenContinue = true
       } else {
        systemState.activeBuffer = "";
        systemState.lastVisualLength = 0;
        systemState.symbolCount = 0;
        systemState.lastSymbolStrLength = 0;
        systemState.lastSymbolKey = currentSymbolSymbolKey;
        delete systemState.symbolBaseBuffer;
        delete systemState.isSymbolStartFullWidth;
        delete systemState.isHyphenContinue;
       }
      }


      systemState.symbolCount++;
      
      const pair = isNumber 
        ? { half: key, full: String.fromCharCode(key.charCodeAt(0) + 0xfee0) } 
        : symbolPairs[key];
      let requestId = ++systemState.currentRequestId;

      // 初回入力時に、連打開始地点の直前文字が全角か判定して保持
     if (systemState.symbolCount === 1) {

      if (systemState.symbolBaseBuffer === undefined) {
         systemState.symbolBaseBuffer = systemState.activeBuffer.substring(0, systemState.activeBuffer.length - systemState.lastSymbolStrLength);
       }
       
        const baseBuf = systemState.activeBuffer.substring(0, systemState.activeBuffer.length - systemState.lastSymbolStrLength);
        let baseKana = translateToJapanese(baseBuf);
        let lastChar = baseKana.length > 0 ? baseKana[baseKana.length - 1] : "";
        if (!lastChar) {
          const isEditable = activeElement.isContentEditable;
          const textVal = isEditable ? activeElement.textContent : activeElement.value;
          const currentPos = isEditable ? (window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : 0) : activeElement.selectionStart;
          const textBefore = textVal.substring(0, currentPos);
          lastChar = textBefore.length > 0 ? textBefore[textBefore.length - 1] : "";
        }


        if (systemState.isSymbolStartFullWidth === undefined) {
         systemState.isSymbolStartFullWidth = /[^\x01-\x7E\xA1-\xA5]/.test(lastChar);
       };
      }

      

      // 回数と直前タイプに応じた記号と文字数を決定
      const isOdd = systemState.symbolCount % 2 !== 0;
      const startWithFull = systemState.isSymbolStartFullWidth && !systemState.isHyphenContinue;
      const currentType = startWithFull ? (isOdd ? 'full' : 'half') : (isOdd ? 'half' : 'full');
      const unitChar = pair[currentType];
      const charAmount = Math.ceil(systemState.symbolCount / 2);
      const newSymbolStr = unitChar.repeat(charAmount);

      const baseBuffer = systemState.symbolBaseBuffer !== undefined ? systemState.symbolBaseBuffer : systemState.activeBuffer.substring(0, systemState.activeBuffer.length - systemState.lastSymbolStrLength);
      const baseKana = translateToJapanese(baseBuffer);


      systemState.activeBuffer = baseBuffer + newSymbolStr;
      systemState.lastSymbolStrLength = newSymbolStr.length;

      const currentKana = baseKana + newSymbolStr;
      deleteLeftText(activeElement, systemState.lastVisualLength);
      insertText(activeElement, currentKana);
      systemState.lastVisualLength = currentKana.length;
      // 自動漢字変換タイマーの発動
  
      clearTimeout(debounceTimer);

     const isFullWidthSymbol = /[^\x01-\x7E\xA1-\xA5]/.test(newSymbolStr);
     const targetConvertText = isFullWidthSymbol ? (baseKana + newSymbolStr) : baseKana;
     const appendSuffix = isFullWidthSymbol ? "" : newSymbolStr;

    const hasOnlySymbols = /^[\u30fc\x21-\x2e\x3a-\x40\x5b-\x60\x7b-\x7e\uff01-\uff0f\uff3b-\uff40]+$/.test(targetConvertText);

    if (targetConvertText.length > 0 && !hasOnlySymbols && key !== '-') {
        debounceTimer = setTimeout(async () => {
         let kanjiText = targetConvertText;
          if (typeof window.convertKanaToKanji === 'function') {
           kanjiText = await window.convertKanaToKanji(targetConvertText);
          } else if (typeof window.getKanjiCandidates === 'function') {
           const candidates = await window.getKanjiCandidates(targetConvertText);
            if (candidates && candidates.length > 0) kanjiText = candidates[0];
          }
          if (requestId !== systemState.currentRequestId) return;
            if (kanjiText && kanjiText !== targetConvertText) {
            const fullText = kanjiText + appendSuffix;
              deleteLeftText(activeElement, systemState.lastVisualLength);
              insertText(activeElement, fullText);
              systemState.lastVisualLength = fullText.length;
            }
            else {
              systemState.lastVisualLength = targetConvertText.length + appendSuffix.length;
            }
        }, 80);
      }
    }
    // 通常の英字入力
    else {
      handleCustomIME(activeElement, key);
    }
}