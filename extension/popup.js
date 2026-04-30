async function loadFolders() {
  const select = document.getElementById('folderSelect');

  try {
    const response = await fetch('https://research-companion-production-ed0b.up.railway.app');
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

loadFolders();

document.getElementById('saveBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const folder_id = document.getElementById('folderSelect').value;
  status.textContent = 'Reading page...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    const content = results[0].result;
    status.textContent = 'Summarizing...';

    const response = await fetch('https://research-companion-production-ed0b.up.railway.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        content: content,
        folder_id: folder_id
      })
    });

    const data = await response.json();
    status.textContent = 'Saved! Check your dashboard.';

  } catch (error) {
    status.textContent = 'Error: ' + error.message;
  }
});