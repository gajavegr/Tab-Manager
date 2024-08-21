// background.js

let tabData = [];

function updateTabData() {
  chrome.tabs.query({}, function (tabs) {
    tabData = tabs.map(tab => ({
      url: tab.url,
      title: tab.title,
      windowId: tab.windowId,
    }));
  });
}

chrome.tabs.onCreated.addListener(updateTabData);
chrome.tabs.onRemoved.addListener(updateTabData);
chrome.tabs.onUpdated.addListener(updateTabData);

updateTabData();

// Service worker for Manifest V3
chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'tabManager') {
    port.onMessage.addListener(function (msg) {
      if (msg === 'getTabData') {
        port.postMessage(tabData);
      }
    });
  }
});
