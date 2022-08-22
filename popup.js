// Core const
let workspaceId = null;
let apiKey = null;
let client = null;
let clientList = [];

chrome.storage.local.get(['tooglWorkspaceId', 'togglAppiKey'], ({ tooglWorkspaceId, togglAppiKey }) => {
  workspaceId = tooglWorkspaceId;
  apiKey = togglAppiKey;
  if (
    typeof tooglWorkspaceId === 'undefined' ||
    typeof togglAppiKey === 'undefined' ||
    workspaceId === '' ||
    apiKey === ''
  ) {
    document.querySelector('#settingsMsg').classList.remove('hideme');
    document.querySelector('#projectContent').classList.add('hideme');
  } else {
    document.querySelector('#settingsMsg').classList.add('hideme');
    document.querySelector('#projectContent').classList.remove('hideme');
    start();
  }
});

chrome.storage.local.get('tabCache', ({ tabCache }) => {
  if (tabCache.clientName) {
    document.querySelector('#clientName').value = tabCache.clientName;
  }
  if (tabCache.caseId) {
    document.querySelector('#caseId').value = tabCache.caseId;
  }
  if (tabCache.caseTitle) {
    document.querySelector('#caseTitle').value = tabCache.caseTitle;
  }
  if (tabCache.validClient) {
    document.querySelector('#viewProject').classList.remove('hideme');
  }
});

// Validate user/ get details.
const getUser = async () => {
  return await fetch('https://api.track.toggl.com/api/v9/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${apiKey}:api_token`)}`,
    },
  })
    .then((resp) => resp.json())
    .then((json) => json)
    .catch((err) => console.error(err));
};

// Get Clients.
const getClients = async () => {
  return await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${apiKey}:api_token`)}`,
    },
  })
    .then((resp) => resp.json())
    .then((json) => json)
    .catch((err) => console.error(err));
};

// Create client.
const createClient = async (clientName) => {
  return await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`, {
    method: 'POST',
    body: JSON.stringify({
      name: clientName,
      wid: workspaceId,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${apiKey}:api_token`)}`,
    },
  })
    .then((resp) => resp.json())
    .then((json) => json)
    .catch((err) => console.error(err));
};

// Create project.
const createProject = async (projectName, templateId, clientId) => {
  return await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    body: JSON.stringify({
      active: true,
      //is_private: true,
      name: `[Mikes New Test Project]:: ${projectName}`,
      template: true,
      template_id: templateId,
      client_id: clientId,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${apiKey}:api_token`)}`,
    },
  })
    .then((resp) => resp.json())
    .then((json) => json)
    .catch((err) => console.error(err));
};

const setTabCache = (key, value) => {
  chrome.storage.local.get('tabCache', ({ tabCache }) => {
    const newTabCache = {
      ...tabCache,
    };
    newTabCache[key] = value;
    chrome.storage.local.set({ tabCache: newTabCache }, () => {});
  });
};

const resetTabeCache = () => {
  chrome.storage.local.set({ tabCache: {} }, () => {});
};

document.querySelector('#editSettingsBtn').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

document.querySelectorAll('input[type="text"]').forEach((input) => {
  input.addEventListener('keyup', (e) => {
    setTabCache(e.target.id, e.target.value);

    if (e.target.id === 'clientName' && e.target.value === '') {
      document.querySelector('#viewProject').classList.add('hideme');
      setTimeout(() => {
        setTabCache('validClient', false);
      }, 300);
    }
  });
});

document.querySelector('#checkClientNameBtn').addEventListener('click', async () => {
  document.querySelector('#viewProject').classList.add('hideme');
  document.querySelector('#clientInvalid').classList.add('hideme');
  document.querySelector('#clientValid').classList.add('hideme');
  document.querySelector('#addClientBtn').classList.add('hideme');

  // Check if client name exists.
  const clientName = document.querySelector('#clientName');
  const clientArray = clientList.filter((obj) => obj.name === clientName.value);

  if (clientArray.length < 1) {
    // Show create client button.
    document.querySelector('#clientInvalid').classList.remove('hideme');
    document.querySelector('#addClientBtn').classList.remove('hideme');
  } else {
    client = clientArray.pop();
    setTabCache('validClient', true);

    document.querySelector('#clientValid').classList.remove('hideme');
    document.querySelector('#viewProject').classList.remove('hideme');
  }
});

document.querySelector('#addClientBtn').addEventListener('click', async () => {
  createClient(clientName.value).then((data) => {
    client = data;
    setTabCache('validClient', true);

    document.querySelector('#clientInvalid').classList.add('hideme');
    document.querySelector('#addClientBtn').classList.add('hideme');
    document.querySelector('#clientValid').classList.remove('hideme');
    document.querySelector('#viewProject').classList.remove('hideme');
  });
});

document.querySelector('#caseType').addEventListener('change', (e) => {
  document.querySelector('#addToTogglBtn').disabled = e.target.value === '';
});

document.querySelector('#addToTogglBtn').addEventListener('click', async () => {
  const caseId = document.querySelector('#caseId').value;
  const [caseTypeTitle, templateIdShortTermCase] = document.querySelector('#caseType').value.split('|');
  const caseTitle = document.querySelector('#caseTitle').value;

  if (typeof templateIdShortTermCase === 'undefined') {
    return;
  }

  // Add project
  const projectName = `${client.name} - ${caseTypeTitle} - ${caseTitle} | ${caseId}`;
  createProject(projectName, parseInt(templateIdShortTermCase), client.id).then((data) => {
    // todo display project link
    document.querySelector('#viewProject').classList.add('hideme');

    const status = document.querySelector('#status');
    status.textContent = 'Project created.';
    /* setTimeout(function () {
      status.textContent = '';
    }, 3000); */

    resetTabeCache();

    document.querySelector('#clientName').value = '';
    document.querySelector('#caseId').value = '';
    document.querySelector('#caseType').selectedIndex = 0;
    document.querySelector('#caseTitle').value = '';
    document.querySelector('#addToTogglBtn').disabled = true;
  });
});

const start = async function () {
  // Cache user data for 24h.
  chrome.storage.local.get(['togglUserCache', 'togglUserCacheTime'], ({ togglUserCache, togglUserCacheTime }) => {
    if (togglUserCache && togglUserCacheTime) {
      if (togglUserCacheTime > Date.now() - 60 * 60 * 24 * 1000) {
        document.querySelector('#userName').innerHTML = togglUserCache.fullname;
        return;
      }
    }
    getUser().then((me) => {
      chrome.storage.local.set({ togglUserCache: me, togglUserCacheTime: Date.now() }, () => {
        document.querySelector('#userName').innerHTML = me.fullname;
      });
    });
  });

  getClients().then((data) => {
    clientList = data;
  });
};
