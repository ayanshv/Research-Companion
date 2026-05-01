const BACKEND = 'https://research-companion-production-ed0b.up.railway.app';

async function init() {
  const result = await chrome.storage.local.get('gemini_api_key');

  if (result.gemini_api_key) {
    showMain(result.gemini_api_key);
  } else {
    document.getElementById('onboarding').style.display = 'block';
    document.getElementById('main').style.display = 'none';
  }
}

async function showMain(apiKey) {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('main').style.display = 'block';
  loadFolders(apiKey);
}

async function loadFolders(apiKey) {
  const select = document.getElementById('folderSelect');

  try {
    const response = await fetch(`${BACKEND}/folders`, {
      headers: { 'X-API-Key': apiKey }
    });
    const data = await response.json();

    data.folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder[0];
      option.textContent = folder[1];
      select.appendChild(option);
    });
  } catch (error) {
    console.log('Could not load folders:', error);
  }
}

document.getElementById('save-key-btn').addEventListener('click', async () => {
  const key = document.getElementById('api-key-input').value.trim();
  const status = document.getElementById('onboarding-status');

  if (!key) {
    status.textContent = 'Please paste your API key first.';
    return;
  }

  status.textContent = 'Saving...';
  await chrome.storage.local.set({ gemini_api_key: key });
  status.textContent = 'Saved!';

  setTimeout(() => showMain(key), 800);
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const folder_id = document.getElementById('folderSelect').value;
  status.textContent = 'Reading page...';

  const result = await chrome.storage.local.get('gemini_api_key');
  const apiKey = result.gemini_api_key;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    const content = results[0].result;
    status.textContent = 'Summarizing...';

    const response = await fetch(`${BACKEND}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        content: content,
        folder_id: folder_id
      })
    });

    const data = await response.json();

    if (data.error) {
      status.textContent = data.error;
    } else {
      status.textContent = 'Saved! Check your dashboard.';
    }

  } catch (error) {
    status.textContent = 'Error: ' + error.message;
  }
});

init();