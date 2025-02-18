chrome.runtime.onMessage.addListener(msg => {
  playAudio(msg.play);
});


async function playAudio({ info }) {
  let reader = new FileReader();
  const url = `https://deprecatedapis.tts.quest/v2/voicevox/audio/?key=${'a39556P567y4o-5'}&speaker=2&pitch=0&intonationScale=1&speed=1&text=${encodeURIComponent(info.selectionText)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('音声の取得に失敗しました');
  }
  
  const blob = await response.blob();
  reader.readAsDataURL(blob);
  reader.onload = async function() {
    const audio = new Audio(reader.result);
    console.log(audio);
    audio.play();
  };
};