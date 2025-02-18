// import { useState } from 'react'
import { useEffect } from "react";
// import { handleClick } from "./feature/handleClick";

function App() {
  useEffect(async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: async function(text) {
        try {
          const response = await fetch(
            `https://deprecatedapis.tts.quest/v2/voicevox/audio/?key=${'a39556P567y4o-5'}&speaker=1&pitch=0&intonationScale=1&speed=1.2&text=${encodeURIComponent(
              text
            )}`
          );
      
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          };
      
          const blob = await response.blob();
          const audio = new Audio(URL.createObjectURL(blob));
          await audio.play();
        } catch (error) {
          console.error('Failed to fetch or play audio:', error); 
        };
      },
    });
  }, []);

  return (
    <>
      {/* <button id="btn" onClick={() => handleClick(targetUrl)}>Run</button>
      <p className=""></p> */}
    </>
  );
};

export default App;
