// Pythonサーバーを使わず、拡張機能から直接Googleの漢字変換APIを呼ぶ関数
window.convertKanaToKanji = async function(kanaText) {
  if (!kanaText) return "";

  try {
    // Googleの漢字変換APIへ直接リクエストを送る
    const encodedText = encodeURIComponent(kanaText);
    const url = `https://www.google.com/transliterate?langpair=ja-Hira|ja&text=${encodedText}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // 取得した変換結果（第一候補）を結合する
    let convertedText = "";
    for (const item of data) {
      if (item && item[1] && item[1].length > 0) {
        convertedText += item[1][0]; // 最高確率の漢字候補
      } else {
        convertedText += item[0];
      }
    }

    return convertedText || kanaText;
  } catch (error) {
    console.error("漢字変換API通信エラー:", error);
    return kanaText; // エラー時はひらがなのまま返す
  }
};