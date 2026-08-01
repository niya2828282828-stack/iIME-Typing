// src/js/main.js

// タイピングした生のアルファベットを裏で記憶するバッファ
const systemState = {
  activeBuffer: "",           // 現在の入力中のアルファベットバッファ
  lastVisualLength: 0,
  currentRequestId: 0,
  isEnglishModeActive: false,
  symbolCount: 0,
  lastSymbolKey: "",
  isSymbolStartFullWidth: false,
  lastSymbolStrLength: 0,
  candidateIndex: 0,
};

let debounceTimer = null;

// フォーカスアウト時に全ての記憶を消去してリセットする
document.addEventListener('focusout', clearAllBuffers);

// 【メインロジック：タイピングと同時に高確率な漢字へ変換】
function handleCustomIME(activeElement, key) {
  systemState.candidateIndex = 0;
  deleteLeftText(activeElement, systemState.lastVisualLength);

  systemState.activeBuffer += key;

  let currentKana = translateToJapanese(systemState.activeBuffer);
  insertText(activeElement, currentKana);
  systemState.lastVisualLength = currentKana.length;

  let requestId = ++systemState.currentRequestId;

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
      if (typeof jpDictionary !== 'undefined' && jpDictionary[substr3]) { 
        convertedText += jpDictionary[substr3]; 
        tempBuffer = tempBuffer.substring(3); 
        found = true; 
      }
    }
    if (!found && tempBuffer.length >= 2) {
      const substr2 = tempBuffer.substring(0, 2);
      if (typeof jpDictionary !== 'undefined' && jpDictionary[substr2]) { 
        convertedText += jpDictionary[substr2]; 
        tempBuffer = tempBuffer.substring(2); 
        found = true; 
      }
    }
    if (!found && tempBuffer.length >= 1) {
      const substr1 = tempBuffer.substring(0, 1);
      if (typeof jpDictionary !== 'undefined' && jpDictionary[substr1]) { 
        convertedText += jpDictionary[substr1]; 
        tempBuffer = tempBuffer.substring(1); 
        found = true; 
      }
    }
    if (!found) { 
      convertedText += tempBuffer[0]; 
      tempBuffer = tempBuffer.substring(1); 
    }
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
    if (data && data[0] && data[0][1]) {
      return data[0][1];
    }
  } catch (error) {
    console.error("Google IME API Error:", error);
  }
  return [kana];
};

function clearAllBuffers() {
  clearTimeout(debounceTimer);
  systemState.activeBuffer = "";
  systemState.lastVisualLength = 0;
  systemState.isEnglishModeActive = false;
  systemState.currentRequestId++;
}