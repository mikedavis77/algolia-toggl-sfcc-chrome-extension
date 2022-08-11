chrome.runtime.onMessage.addListener(function (request) {
  //console.log('toggl::req lis', request);
  /* if (request.execute_activateSfdcToggle == true) {
    chrome.action.setPopup({ popup: 'popup.html' });
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4688F1' });
  } else {
    chrome.action.setPopup({ popup: 'popupNo.html' });
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '' });
  } */
  // Check for a chorus id being set.
  /* chrome.storage.sync.get('chorusId', ({ chorusId }) => {
        if (chorusId === '') {
          console.error('There is no ChorusId set. Please save it in the Chorus Scheduler extension settings');
          return;
        }
        addChorusButtonToEvent(0);
      }); */
});
