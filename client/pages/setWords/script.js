import WebSocketClient from '/resources/webSocketService.mjs';
import { adminHeaders, gamePageUrl, getGameId, setAdminToken } from '/resources/gameContext.mjs';

document.addEventListener('DOMContentLoaded', () => {
  createPromptInputs();
  initializeWebSocket();
  document.getElementById('submit-button').addEventListener('click', submitPrompts);
  document.getElementById('perplayer').addEventListener('change', createPromptInputs);
  document.getElementById('word-suggestion').addEventListener('click', suggestWords);
});

function initializeWebSocket() {
  if (!getGameId()) {
    return;
  }
  const wsClient = new WebSocketClient();
  wsClient.on('WORDS_UPDATED', () => {
    window.location.reload();
  });
}

function createPromptInputs() {
  const container = document.getElementById('prompt-container');
  const numberOfPrompts = parseInt(document.getElementById('perplayer').value, 10) || 9;
  const currentInputs = container.getElementsByTagName('input').length;
  const time = document.getElementById('duration');

  if (time.value < 1) {
    time.value = numberOfPrompts * 5;
  }

  if (numberOfPrompts > currentInputs) {
    for (let i = currentInputs; i < numberOfPrompts; i += 1) {
      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('number-input');
      container.appendChild(input);
    }
  } else if (numberOfPrompts < currentInputs) {
    for (let i = currentInputs; i > numberOfPrompts; i -= 1) {
      container.removeChild(container.lastChild);
    }
  }
}

function suggestWords() {
  const emptyPrompts = Array.from(document.getElementById('prompt-container').getElementsByTagName('input'))
    .filter(input => input.value.trim() === '').length;

  if (emptyPrompts <= 0) {
    alert('All prompt fields are already filled.');
    return;
  }

  const gameId = getGameId();
  const url = gameId ? `/word/${encodeURIComponent(gameId)}/setup?amount=${emptyPrompts}` : `/word/setup?amount=${emptyPrompts}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const emptyInputs = Array.from(document.getElementById('prompt-container').getElementsByTagName('input'))
        .filter(input => input.value.trim() === '');

      for (let i = 0; i < data.words.length && i < emptyInputs.length; i += 1) {
        emptyInputs[i].value = data.words[i];
      }
    })
    .catch(error => {
      console.error('Error fetching suggested words:', error);
      alert('Failed to fetch suggested words.');
    });
}

function collectRequestBody() {
  const promptContainer = document.getElementById('prompt-container');
  const promptInputs = promptContainer.getElementsByTagName('input');
  const prompts = [];

  for (const input of promptInputs) {
    if (input.value.trim() !== '') {
      prompts.push(input.value.trim());
    }
  }

  return {
    words: prompts,
    wordsPerPlayer: document.getElementById('perplayer').value || 9,
    time: document.getElementById('duration').value,
    votesPerPlayer: document.getElementById('votes').value || 0,
    penalty: document.getElementById('penalty').checked
  };
}

function validateSettings(requestBody) {
  const time = parseInt(requestBody.time, 10);
  const votes = parseInt(requestBody.votesPerPlayer, 10);

  if (time < 1) {
    alert('Please enter a valid duration');
    return false;
  }

  if (time < 10 && !confirm('Are you sure you want to start the game with less than 10 minutes?')) {
    return false;
  }

  if (time > 60 && !confirm('Are you sure you want to start the game with more than 60 minutes?')) {
    return false;
  }

  if (votes === 0 && !confirm('Are you sure you want to start the game without voting?')) {
    return false;
  }

  return true;
}

async function submitPrompts() {
  const requestBody = collectRequestBody();

  if (!validateSettings(requestBody)) {
    return;
  }

  const gameId = getGameId();
  const url = gameId ? `/word/${encodeURIComponent(gameId)}/set` : '/game';
  const headers = gameId
    ? adminHeaders({ 'Content-Type': 'application/json' })
    : { 'Content-Type': 'application/json' };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    alert(data.message || 'Failed to create game.');
    return;
  }

  const data = await response.json();

  if (data.adminToken) {
    setAdminToken(data.adminToken, data.gameId);
  }

  window.location.href = gamePageUrl(data.gameId || gameId);
}
