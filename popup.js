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
  if (tabCache.client) {
    client = tabCache.client;
  }
  if (tabCache.clientName) {
    document.querySelector('#clientName').value = tabCache.clientName;
  }
  if (tabCache.caseId) {
    document.querySelector('#caseId').value = tabCache.caseId;
  }
  if (tabCache.caseTitle) {
    document.querySelector('#caseTitle').value = tabCache.caseTitle;
  }
});

// Toggl API wrappers.
const toggleApiGetHeaders = () => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${btoa(`${apiKey}:api_token`)}`,
  };
};

const togglApiClientGet = async (url) => {
  return await fetch(url, {
    method: 'GET',
    headers: toggleApiGetHeaders(),
  })
    .then((resp) => resp.json())
    .then((json) => json)
    .catch((err) => console.error(url, err));
};

const togglApiClientPost = async (url, data = {}) => {
  return await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: toggleApiGetHeaders(),
  })
    .then((resp) => resp.json())
    .then((json) => json)
    .catch((err) => console.error(url, err));
};

// Get user details.
const getUser = async () => {
  return togglApiClientGet('https://api.track.toggl.com/api/v9/me');
};

// Get clients.
const getClients = async () => {
  return togglApiClientGet(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`);
};

// Create client.
const createClient = async (clientName) => {
  const data = {
    name: clientName,
    wid: parseInt(workspaceId),
  };
  return togglApiClientPost(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`, data);
};

// Create project.
const createProject = async (projectName, templateId, clientId) => {
  const data = {
    active: true,
    name: projectName,
    template: true,
    template_id: parseInt(templateId),
    client_id: parseInt(clientId),
  };
  return togglApiClientPost(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`, data);
};

// Set tab cache.
const setTabCache = (key, value) => {
  chrome.storage.local.get('tabCache', ({ tabCache }) => {
    const newTabCache = {
      ...tabCache,
    };
    newTabCache[key] = value;
    chrome.storage.local.set({ tabCache: newTabCache }, () => {});
  });
};

const resetTabCache = () => {
  chrome.storage.local.set({ tabCache: {} }, () => {});
};

const setClient = (data) => {
  client = data;
  setTabCache('client', client);
};

const setUsername = (username) => {
  document.querySelector('#userName').innerHTML = username;
};

// Validate that the project can be created
const validateCanCreateProject = () => {
  let isValid = true;
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    if (input.value === '') {
      isValid = false;
    }
  });

  if (!client) {
    isValid = false;
  }

  if (document.querySelector('#caseType').value === '') {
    isValid = false;
  }

  document.querySelector('#addToTogglBtn').disabled = !isValid;
};

/*** Event listeners ***/

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
    validateCanCreateProject();
  });
});

document.querySelector('#checkClientNameBtn').addEventListener('click', async () => {
  document.querySelector('#clientInvalid').classList.add('hideme');
  document.querySelector('#clientValid').classList.add('hideme');
  document.querySelector('#addClientBtn').classList.add('hideme');

  // Check if client name exists.
  const clientNameEl = document.querySelector('#clientName');
  const clientArray = clientList.filter((obj) => obj.name === clientNameEl.value);

  if (clientArray.length < 1) {
    // Show create client button.
    document.querySelector('#clientInvalid').classList.remove('hideme');
    document.querySelector('#addClientBtn').classList.remove('hideme');
  } else {
    setClient(clientArray.pop());

    document.querySelector('#clientValid').classList.remove('hideme');
  }
});

document.querySelector('#addClientBtn').addEventListener('click', async () => {
  createClient(clientName.value).then((data) => {
    setClient(data);

    document.querySelector('#clientInvalid').classList.add('hideme');
    document.querySelector('#addClientBtn').classList.add('hideme');
    document.querySelector('#clientValid').classList.remove('hideme');
  });
});

document.querySelector('#caseType').addEventListener('change', (e) => {
  validateCanCreateProject();
});

document.querySelector('#addToTogglBtn').addEventListener('click', async () => {
  const caseId = document.querySelector('#caseId').value;
  const caseTitle = document.querySelector('#caseTitle').value;
  const templateId = document.querySelector('#caseType').value;

  const caseTypeEl = document.querySelector('#caseType');
  const caseTypeTitle = caseTypeEl.options[caseTypeEl.selectedIndex].text;

  if (typeof templateId === 'undefined') {
    return;
  }

  // Add project
  const caseTitleText = caseTypeTitle.toLowerCase() === 'short term case' ? ` - ${caseTitle}` : '';
  const projectName = `${client.name} - ${caseTypeTitle}${caseTitleText} |${caseId}`;
  createProject(projectName, templateId, client.id).then((data) => {
    // todo display project link?
    const status = document.querySelector('#status');
    status.textContent = 'Project created.';

    resetTabCache();

    client = null;
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
        setUsername(togglUserCache.fullname);
        return;
      }
    }
    getUser().then((me) => {
      chrome.storage.local.set({ togglUserCache: me, togglUserCacheTime: Date.now() }, () => {
        setUsername(me.fullname);
      });
    });
  });

  getClients().then((data) => {
    clientList = data;
  });
};
