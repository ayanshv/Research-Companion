const API = 'http://localhost:5000';

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
      <button class="delete-btn" onclick="deleteCard(${row[0]})">️ Delete</button>
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
  loadSummaries();
}

document.getElementById('searchBar').addEventListener('input', async (e) => {
  const query = e.target.value;
  if (query.length < 2) { loadSummaries(); return; }
  const response = await fetch(`${API}/search?q=${query}`);
  const data = await response.json();
  displayCards(data.results);
});

document.getElementById('topicFilter').addEventListener('change', async (e) => {
  const topic = e.target.value;
  if (!topic) { loadSummaries(); return; }
  const response = await fetch(`${API}/summaries/topic/${topic}`);
  const data = await response.json();
  displayCards(data.summaries);
});

loadSummaries();