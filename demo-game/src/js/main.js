// タイピングした生のアルファベットを裏で記憶するバッファ↓
const systemState = {
  activeBuffer: "",           // 現在の入力中のアルファベットバッファ
  lastVisualLength: 0,
  currentRequestId: 0,
  isEnglishModeActive: false,
  symbolCount: 0,
  lastSymbolKey: "", // 直前に押された記号キー（'-', '.', ','）
  isSymbolStartFullWidth: false, // 記号開始時の直前が全角かの判定フラグ
  lastSymbolStrLength: 0,
  candidateIndex: 0,
}


// 全角二重入力ブロック
document.addEventListener('input', function (event) {
  const activeElement = document.activeElement;
  if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && !activeElement.isContentEditable)) return;
  if (event.inputType === "insertCompositionText" || event.inputType === "insertText") {
    if (event.data) {
      deleteLeftText(activeElement, event.data.length);
    }
  }
}, true);

// キーボードイベントの監視
document.addEventListener('keydown', function (event) {
  const activeElement = document.activeElement;
  if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && !activeElement.isContentEditable)) return;
  if (event.ctrlKey || event.metaKey) {
    return;
  }
  //event.codeはKeyAのような形式、event.keyはaのような形式
  let key = "";
  if (event.code && event.code.startsWith("Key")) {
    key = event.code.replace("Key", "").toLowerCase();//Keyを除去してアルファベットのみに
  } else {//アルファベット以外のキーはevent.keyを使う
    key = event.key;
  }

  if (event.key === 'Tab' || event.code === 'Tab') {
    if (systemState.activeBuffer.length > 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearTimeout(debounceTimer); // 自動変換タイマーを確実に止める

      const currentKana = translateToJapanese(systemState.activeBuffer);

      if (typeof window.getKanjiCandidates === 'function') {
        const requestId = ++systemState.currentRequestId;
        window.getKanjiCandidates(currentKana).then(candidates => {
          if (requestId !== systemState.currentRequestId) return;
          if (candidates && candidates.length > 0) {
            // 画面上に既に出ている文字（直前の変換漢字またはひらがな）を全削除して置き換える
            if (systemState.lastVisualLength > 0) {
              deleteLeftText(activeElement, systemState.lastVisualLength);
            }

            // 次の候補を取得
            const nextCandidate = candidates[systemState.candidateIndex % candidates.length];
            systemState.candidateIndex++;

            insertText(activeElement, nextCandidate);
            systemState.lastVisualLength = nextCandidate.length;
          }
        });
      }
    }
    return;
  }

  else if (key.match(/^[a-z0-9]$/) || symbolPairs[key]) {
    window.inputBasicKeys(
      event, 
      key, 
      activeElement, 
      symbolPairs,
      debounceTimer,
      systemState
    );
  } 



  else if (event.key === ' ') {
    window.inputSpace(
      event,
      activeElement,
      debounceTimer,
      systemState
    );
  }

  //Enterキーで全ての記憶を消去してリセットする
  else if (event.key === 'Enter') {
    if (systemState.activeBuffer.length > 0 && typeof window.triggerGlow === 'function') window.triggerGlow(activeElement);
    clearAllBuffers();
  }

  else if (event.key === 'Backspace') {
    clearTimeout(debounceTimer);
    systemState.currentRequestId++;
    systemState.activeBuffer = "";
    systemState.lastVisualLength = 0;
    systemState.isEnglishModeActive = false;
    systemState.symbolCount = 0;
    systemState.lastSymbolKey = "";
    systemState.lastSymbolStrLength = 0;
  }
}, true);

// フォーカスアウト時に全ての記憶を消去してリセットする
document.addEventListener('focusout', clearAllBuffers);

// 入力後の自動漢字変換までのウェイト用タイマー
let debounceTimer = null;

// 【メインロジック：タイピングと同時に高確率な漢字へ変換】
function handleCustomIME(activeElement, key) {
  systemState.candidateIndex = 0;
  deleteLeftText(activeElement, systemState.lastVisualLength);

  systemState.activeBuffer += key;

  let currentKana = translateToJapanese(systemState.activeBuffer);
  insertText(activeElement, currentKana);
  systemState.lastVisualLength = currentKana.length;

  let requestId = ++systemState.currentRequestId;

  // 2. 入力が一瞬止まったら（80ms後）、最高確率の漢字に置き換える
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (typeof window.convertKanaToKanji === 'function' && currentKana.length > 0) {
      const kanjiText = await window.convertKanaToKanji(currentKana);
      if (requestId !== systemState.currentRequestId) return;
      if (kanjiText && kanjiText !== currentKana) {
        deleteLeftText(activeElement, systemState.lastVisualLength);
        insertText(activeElement, kanjiText);
        systemState.lastVisualLength = kanjiText.length;
      }
    }
  }, 40);
}

// アルファベットをひらがなに変換する関数
function translateToJapanese(bufferText) {
  let convertedText = "";
  let tempBuffer = bufferText;

  while (tempBuffer.length > 0) {
    let found = false;
    if (tempBuffer.length >= 3) {
      const substr3 = tempBuffer.substring(0, 3);
      if (jpDictionary[substr3]) { convertedText += jpDictionary[substr3]; tempBuffer = tempBuffer.substring(3); found = true; }
    }
    if (!found && tempBuffer.length >= 2) {
      const substr2 = tempBuffer.substring(0, 2);
      if (jpDictionary[substr2]) { convertedText += jpDictionary[substr2]; tempBuffer = tempBuffer.substring(2); found = true; }
    }
    if (!found && tempBuffer.length >= 1) {
      const substr1 = tempBuffer.substring(0, 1);
      if (jpDictionary[substr1]) { convertedText += jpDictionary[substr1]; tempBuffer = tempBuffer.substring(1); found = true; }
    }
    if (!found) { convertedText += tempBuffer[0]; tempBuffer = tempBuffer.substring(1); }
  }
  return convertedText;
}

// テキスト挿入・削除補助関数
function insertText(inputElement, text) {
  if (inputElement.isContentEditable) {
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  const start = inputElement.selectionStart;
  const end = inputElement.selectionEnd;
  const value = inputElement.value;
  inputElement.value = value.substring(0, start) + text + value.substring(end);
  inputElement.selectionStart = inputElement.selectionEnd = start + text.length;
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
}

function deleteLeftText(inputElement, count) {
  if (count <= 0) return;
  if (inputElement.isContentEditable) {
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      const endOffset = range.startOffset;
      const startOffset = Math.max(0, endOffset - count);
      range.setStart(range.startContainer, startOffset);
      range.setEnd(range.startContainer, endOffset);
      range.deleteContents();
    }
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const start = inputElement.selectionStart;
  const value = inputElement.value;
  inputElement.value = value.substring(0, start - count) + value.substring(start);
  inputElement.selectionStart = inputElement.selectionEnd = start - count;
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
}

window.getKanjiCandidates = async function (kana) {
  if (!kana) return [];
  try {
    const response = await fetch(`https://www.google.com/transliterate?langpair=ja-Hira|ja&text=${encodeURIComponent(kana)}`);
    const data = await response.json();
    // Google APIのレスポンス形式: [ [ "入力よみ", [ "候補1", "候補2", "候補3", ... ] ] ]
    if (data && data[0] && data[0][1]) {
      return data[0][1]; // 変換候補の配列（例: ["感じ", "漢字", "幹事", "かんじ"]）
    }
  } catch (error) {
    console.error("Google IME API Error:", error);
  }
  return [kana]; // エラー時はひらがなを返す
};

// すべての記憶をノートから消去してリセットする命令
function clearAllBuffers() {
  clearTimeout(debounceTimer); // 漢字変換のタイマーを止める
  systemState.activeBuffer = "";           // ノートを空にする
  systemState.lastVisualLength = 0;        // 画面の文字数の記憶も0に
  systemState.isEnglishModeActive = false;
  hyphenCount = 0;
  lastHyphenStrLength = 0;
  systemState.currentRequestId++;          // 変換IDを進めて、遅れてやってくる漢字変換を無視する
}