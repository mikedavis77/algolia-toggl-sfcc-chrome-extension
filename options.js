chrome.storage.local.get(['tooglWorkspaceId', 'togglAppiKey'], ({ tooglWorkspaceId, togglAppiKey }) => {
  document.querySelector('#workspaceId').value = typeof tooglWorkspaceId !== 'undefined' ? tooglWorkspaceId : '';
  document.querySelector('#apiKey').value = typeof togglAppiKey !== 'undefined' ? togglAppiKey : '';
});

document.querySelector('#saveSettingsBtn').addEventListener('click', () => {
  workspaceId = document.querySelector('#workspaceId').value;
  apiKey = document.querySelector('#apiKey').value;
  chrome.storage.local.set({ tooglWorkspaceId: workspaceId, togglAppiKey: apiKey }, () => {
    // todo validate api key.

    // Update status to let user know options were saved.
    const status = document.querySelector('#status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 3000);
  });
});
