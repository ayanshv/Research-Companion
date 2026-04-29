document.getElementById('saveBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Reading page...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    const content = results[0].result;
    status.textContent = 'Summarizing...';

    const response = await fetch('http://localhost:5000/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: tab.url, title: tab.title, content: content })
    });

    const data = await response.json();
    status.textContent = 'Saved! Check your dashboard.';

  } catch (error) {
    status.textContent = 'Error: ' + error.message;
  }
});