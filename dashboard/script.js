let currentFolderId = null;
let currentFolderName = null;

const API = 'https://research-companion-production-ed0b.up.railway.app';

async function loadFolderGrid() {
  const foldersRes = await fetch(`${API}/folders`);
  const foldersData = await foldersRes.json();

  const summariesRes = await fetch(`${API}/summaries`);
  const summariesData = await summariesRes.json();

  const grid = document.getElementById('folder-grid');
  grid.innerHTML = '';

  const allCard = document.createElement('div');
  allCard.className = 'folder-card folder-card-all';
  allCard.innerHTML = `
    <h3>All Research</h3>
    <p>${summariesData.summaries.length} cards</p>
  `;
  allCard.onclick = () => openFolderView('all', 'All Research');
  grid.appendChild(allCard);

  foldersData.folders.forEach(folder => {
    const count = summariesData.summaries.filter(row => row[7] === folder[0]).length;
    const card = document.createElement('div');
    card.className = 'folder-card';
    card.innerHTML = `
      <h3>${folder[1]}</h3>
      <p>${count} cards</p>
      <button class="delete-folder-btn" onclick="deleteFolder(event, ${folder[0]})">Delete</button>
    `;
    card.onclick = () => openFolderView(folder[0], folder[1]);
    grid.appendChild(card);
  });
}

async function deleteFolder(e, id) {
  e.stopPropagation();
  await fetch(`${API}/folders/${id}`, { method: 'DELETE' });
  loadFolderGrid();
}

async function openFolderView(folder_id, folder_name) {
  currentFolderId = folder_id;
  currentFolderName = folder_name;
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('folder-view').style.display = 'block';

  const summaryBox = document.getElementById('folder-summary-box');
  summaryBox.innerHTML = '';

  if (folder_id === 'all') {
    const response = await fetch(`${API}/summaries`);
    const data = await response.json();
    displayCards(data.summaries);
  } else {
    summaryBox.innerHTML = '<p style="color:#888">Generating folder summary...</p>';

    const response = await fetch(`${API}/summaries?folder_id=${folder_id}`);
    const data = await response.json();
    displayCards(data.summaries);

    const summaryRes = await fetch(`${API}/folders/${folder_id}/summary`);
    const summaryData = await summaryRes.json();

    const formatted = summaryData.summary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    summaryBox.innerHTML = `
      <h3>${folder_name} — AI Overview</h3>
      <div>${formatted}</div>
    `;
  }
}

async function loadSummaries() {
  const response = await fetch(`${API}/summaries`);
  const data = await response.json();
  displayCards(data.summaries);
  populateTopicFilter(data.summaries);
}

function displayCards(summaries) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  if (summaries.length === 0) {
    container.innerHTML = '<p style="color:#888">No summaries yet — browse a page and click Save!</p>';
    return;
  }

  summaries.forEach(row => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <span class="topic-badge">${row[6] || 'General'}</span>
      <h2>${row[2]}</h2>
      <a href="${row[1]}" target="_blank">${row[1]}</a>
      <p><strong>Summary:</strong> ${row[3]}</p>
      <div class="keywords"><strong>Keywords:</strong> ${row[4] || 'No keywords'}</div>
      <div class="date">${row[7]}</div>
      <button class="explain-btn" onclick="explainFurther(${row[0]}, '${row[2]}')"
        style="background:${BUTTON_CONFIG.explain.background};color:${BUTTON_CONFIG.explain.textColor};border-radius:${BUTTON_CONFIG.explain.borderRadius}">
        ${BUTTON_CONFIG.explain.label}
      </button>
      <button class="folder-btn" onclick="openAssignFolder(${row[0]})"
        style="background:${BUTTON_CONFIG.moveToFolder.background};color:${BUTTON_CONFIG.moveToFolder.textColor};border-radius:${BUTTON_CONFIG.moveToFolder.borderRadius}">
        ${BUTTON_CONFIG.moveToFolder.label}
      </button>
      <button class="delete-btn" onclick="deleteCard(${row[0]})"
        style="background:${BUTTON_CONFIG.delete.background};color:${BUTTON_CONFIG.delete.textColor};border-radius:${BUTTON_CONFIG.delete.borderRadius}">
        ${BUTTON_CONFIG.delete.label}
      </button>
    `;
    container.appendChild(card);
  });
}

function populateTopicFilter(summaries) {
  const select = document.getElementById('topicFilter');
  select.innerHTML = '<option value="">All Topics</option>';
  const topics = [...new Set(summaries.map(row => row[6]).filter(Boolean))];
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    select.appendChild(option);
  });
}

async function deleteCard(id) {
  await fetch(`${API}/summaries/${id}`, { method: 'DELETE' });
  if (currentFolderId !== null) {
    openFolderView(currentFolderId, currentFolderName);
  } else {
    loadFolderGrid();
  }
}

async function explainFurther(id, title) {
  const overlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  modalTitle.textContent = title;
  modalContent.textContent = 'Loading explanation...';
  overlay.style.display = 'flex';

  try {
    const response = await fetch(`${API}/explain/${id}`);
    const data = await response.json();

    const formatted = data.explanation
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    modalContent.innerHTML = formatted;
  } catch (error) {
    modalContent.textContent = 'Servers are busy right now, please try again in a moment.';
  }
}

async function createFolder() {
  const input = document.getElementById('folder-name-input');
  const name = input.value.trim();
  if (!name) return;

  await fetch(`${API}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_name: name })
  });

  input.value = '';
  document.getElementById('new-folder-modal').style.display = 'none';
  loadFolderGrid();
}

let currentAssignId = null;

async function openAssignFolder(id) {
  currentAssignId = id;

  const response = await fetch(`${API}/folders`);
  const data = await response.json();

  const select = document.getElementById('assign-folder-select');
  select.innerHTML = '';

  data.folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder[0];
    option.textContent = folder[1];
    select.appendChild(option);
  });

  document.getElementById('assign-folder-modal').style.display = 'flex';
}

async function assignToFolder() {
  const folder_id = document.getElementById('assign-folder-select').value;

  await fetch(`${API}/summaries/${currentAssignId}/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_id: folder_id })
  });

  document.getElementById('assign-folder-modal').style.display = 'none';
  loadFolderGrid();
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-overlay').style.display = 'none';
});

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').style.display = 'none';
  }
});

document.getElementById('new-folder-btn').addEventListener('click', () => {
  document.getElementById('new-folder-modal').style.display = 'flex';
});

document.getElementById('cancel-folder-btn').addEventListener('click', () => {
  document.getElementById('new-folder-modal').style.display = 'none';
});

document.getElementById('create-folder-btn').addEventListener('click', createFolder);

document.getElementById('confirm-assign-btn').addEventListener('click', assignToFolder);

document.getElementById('cancel-assign-btn').addEventListener('click', () => {
  document.getElementById('assign-folder-modal').style.display = 'none';
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('folder-view').style.display = 'none';
  document.getElementById('home-view').style.display = 'block';
  loadFolderGrid();
});

document.getElementById('searchBar').addEventListener('input', async (e) => {
  const query = e.target.value;
  if (query.length < 2) { loadFolderGrid(); return; }
  const response = await fetch(`${API}/search?q=${query}`);
  const data = await response.json();
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('folder-view').style.display = 'block';
  document.getElementById('folder-summary-box').innerHTML = '';
  displayCards(data.results);
});

document.getElementById('topicFilter').addEventListener('change', async (e) => {
  const topic = e.target.value;
  if (!topic) { loadFolderGrid(); return; }
  const response = await fetch(`${API}/summaries/topic/${topic}`);
  const data = await response.json();
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('folder-view').style.display = 'block';
  document.getElementById('folder-summary-box').innerHTML = '';
  displayCards(data.summaries);
});

loadFolderGrid();