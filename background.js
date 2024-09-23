chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ workspaceId: '', apiKey: '' }, () => {});
});

const icons = {
  enabled: {
    16: 'images/enabled-16x16.png',
    32: 'images/enabled-32x32.png',
  },
  disabled: {
    16: 'images/disabled-16x16.png',
    32: 'images/disabled-32x32.png',
  },
};

const addListenerForAlgoliaSfdcToggl = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (/algolia.lightning.force.com\/lightning\/r\/Case\/[^/]*/i.test(tabs[0].url)) {
      chrome.storage.local.set({ tabCache: {} }, () => {});
      // todo set icon image
      //chrome.action.setIcon({ path: icons.enabled });
      chrome.action.setPopup({ popup: 'popup.html' });
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#4688F1' });
    } else {
      // todo set disabled icon image
      //chrome.browserAction.setIcon({ path: icons.disabled });
      chrome.action.setPopup({ popup: 'disabled.html' });
      chrome.action.setBadgeText({ text: '' });
    }
  });
};

chrome.tabs.onActivated.addListener((details) => addListenerForAlgoliaSfdcToggl());
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => addListenerForAlgoliaSfdcToggl());
