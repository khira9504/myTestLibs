// import { useState } from 'react'
import { useEffect } from "react";
// import { handleClick } from "./feature/handleClick";

function App() {
  useEffect(async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: function() {
        if(location.href.toString() == "https://mail.google.com/mail/u/0/#settings/accounts") {
          const elements = document.querySelectorAll('*');
          const filterElements = Array.from(elements).filter((element)=> element.textContent == "メールを今すぐ確認する");
          filterElements.forEach(elm => {
            elm.click();
          });
        } else {
          window.open("https://mail.google.com/mail/u/0/#settings/accounts");
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

export default App
