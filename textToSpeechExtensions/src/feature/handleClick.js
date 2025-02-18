export const setUpSystem = (targetUrl) => {
  const getUrl = location.href.toString();
  if(getUrl == targetUrl) {
    const elements = document.querySelectorAll('*');
    const filterElements = Array.from(elements).filter((element)=> element.textContent == "メールを今すぐ確認する");
    filterElements.forEach(elm => {
      elm.click();
    });
  } else {
    window.open(targetUrl);
  };
}

export const handleClick = async() => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setUpSystem(),
  });
};