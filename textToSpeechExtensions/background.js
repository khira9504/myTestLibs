chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'textToSpeech',
    title: 'Text to Speech!!!',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async function(info, tab) {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'testing'
  });
  await chrome.runtime.sendMessage({ play: { info } });
});