chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'textToSpeech',
    title: 'Text to Speech!!!',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async function(info, tab) {
  let reader = new FileReader();
  const url = `https://deprecatedapis.tts.quest/v2/voicevox/audio/?key=${'a39556P567y4o-5'}&speaker=1&pitch=0&intonationScale=1&speed=1.2&text=${encodeURIComponent(info.selectionText)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('音声の取得に失敗しました');
  }
  
  const blob = await response.blob();
  reader.readAsDataURL(blob);
  reader.onload = async function() {
    // これ以降がエラーになる
    console.log(reader.result);
    // const audio = await new Audio(reader.result);
    const audio = reader.result;
    audio.play();
  };
});