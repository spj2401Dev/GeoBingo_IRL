import WebSocketClient from '/resources/webSocketService.mjs';
import { adminHeaders, gamePageUrl, getGameId, setAdminToken } from '/resources/gameContext.mjs';
import { FrontendGameMode, normalizeGameMode } from '/resources/gamemodes/modes.mjs';
import {
  getCreateGameModeConfig,
  listCreateGameModes,
  shouldApplyModeDefaultPromptCount
} from '/resources/gamemodes/createGameModeAdapter.mjs';

let activeMode = FrontendGameMode.INDIVIDUAL;

document.addEventListener('DOMContentLoaded', () => {
  initializeGameModeTabs();
  applyModeSettings({ previousMode: activeMode, forcePromptDefault: true });
  createPromptInputs();
  initializeWebSocket();
  document.getElementById('submit-button').addEventListener('click', submitPrompts);
  document.getElementById('perplayer').addEventListener('change', createPromptInputs);
  document.getElementById('word-suggestion').addEventListener('click', suggestWords);
});

function initializeGameModeTabs() {
  const tabsContainer = document.getElementById('game-mode-tabs');
  tabsContainer.innerHTML = '';

  for (const modeConfig of listCreateGameModes()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-tab';
    button.dataset.gameMode = modeConfig.id;
    button.textContent = modeConfig.tabLabel;
    button.addEventListener('click', () => setActiveMode(modeConfig.id));
    tabsContainer.appendChild(button);
  }

  renderModeTabs();
}

function renderModeTabs() {
  const tabs = document.querySelectorAll('.mode-tab');
  tabs.forEach((tab) => {
    const isActive = normalizeGameMode(tab.dataset.gameMode) === activeMode;
    tab.classList.toggle('mode-tab-active', isActive);
    tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setActiveMode(mode) {
  const nextMode = normalizeGameMode(mode, FrontendGameMode.INDIVIDUAL);
  if (nextMode === activeMode) {
    return;
  }

  const previousMode = activeMode;
  activeMode = nextMode;
  applyModeSettings({ previousMode });
  createPromptInputs();
}

function applyModeSettings({ previousMode, forcePromptDefault = false }) {
  const promptLabel = document.getElementById('prompts-label');
  const promptsInput = document.getElementById('perplayer');
  const votesBlock = document.getElementById('votes-block');
  const votesInput = document.getElementById('votes');
  const skipBlock = document.getElementById('skip-block');
  const skipInput = document.getElementById('allow-skip');
  const modeConfig = getCreateGameModeConfig(activeMode);

  promptLabel.textContent = modeConfig.promptsLabel;
  promptsInput.placeholder = String(modeConfig.defaultPrompts);
  votesBlock.classList.toggle('hidden', !modeConfig.votingEnabled);
  skipBlock.classList.toggle('hidden', !modeConfig.skipConfigVisible);

  if (!modeConfig.votingEnabled) {
    votesInput.value = '0';
  }
  if (!modeConfig.skipConfigVisible) {
    skipInput.checked = false;
  }

  if (forcePromptDefault || shouldApplyModeDefaultPromptCount(promptsInput.value, previousMode, activeMode)) {
    promptsInput.value = String(modeConfig.defaultPrompts);
  }

  renderModeTabs();
}

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
  const modeConfig = getCreateGameModeConfig(activeMode);
  const numberOfPrompts = parseInt(document.getElementById('perplayer').value, 10) || modeConfig.defaultPrompts;
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
  const modeConfig = getCreateGameModeConfig(activeMode);

  for (const input of promptInputs) {
    if (input.value.trim() !== '') {
      prompts.push(input.value.trim());
    }
  }

  const requestBody = {
    words: prompts,
    wordsPerPlayer: document.getElementById('perplayer').value || modeConfig.defaultPrompts,
    time: document.getElementById('duration').value,
    votesPerPlayer: modeConfig.votingEnabled ? (document.getElementById('votes').value || 0) : 0,
    penalty: document.getElementById('penalty').checked,
    allowSkip: modeConfig.skipConfigVisible && document.getElementById('allow-skip').checked,
    gameMode: activeMode
  };

  return requestBody;
}

function validateSettings(requestBody) {
  const time = parseInt(requestBody.time, 10);
  const votes = parseInt(requestBody.votesPerPlayer, 10);
  const modeConfig = getCreateGameModeConfig(activeMode);

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

  if (modeConfig.votingEnabled && votes === 0 && !confirm('Are you sure you want to start the game without voting?')) {
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
