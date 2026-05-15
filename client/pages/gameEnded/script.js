import WebSocketClient from '/resources/webSocketService.mjs';
import { adminHeaders, getGameId, getPlayerSession, isAdmin, storageKey } from '/resources/gameContext.mjs';

const wsClient = new WebSocketClient();
const chatContainer = document.getElementById('chatContainer');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');

function addMessage(username, message) {
  const messageBlock = document.createElement('div');
  messageBlock.classList.add('block', 'card');

  const header = document.createElement('h1');
  header.className = 'chat-header-text';
  header.textContent = username;

  const text = document.createElement('p');
  text.textContent = message;

  messageBlock.appendChild(header);
  messageBlock.appendChild(text);
  chatContainer.insertBefore(messageBlock, chatContainer.firstChild);
}

function storeMessage(username, message) {
  const messages = JSON.parse(localStorage.getItem(storageKey('chatMessages')) || '[]');
  messages.push({ username, message, timestamp: Date.now() });
  localStorage.setItem(storageKey('chatMessages'), JSON.stringify(messages));
}

function loadMessages() {
  const messages = JSON.parse(localStorage.getItem(storageKey('chatMessages')) || '[]');
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const recentMessages = messages.filter(
    (msg) => msg.timestamp > tenMinutesAgo
  );
  recentMessages.forEach((msg) => addMessage(msg.username, msg.message));
}

window.addEventListener('load', loadMessages);

wsClient.on('GAME_RELOAD', () => {
  window.location.reload();
});

wsClient.on('CHAT_MESSAGE', (data) => {
  addMessage(data.username, data.text);
  storeMessage(data.username, data.text);
});

sendButton.addEventListener('click', async () => {
  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  const player = getPlayerSession();
  const username = player?.name || 'Anonymous';
  wsClient.sendEvent('CHAT_MESSAGE', { username, text: message });
  messageInput.value = '';
});

const admin = document.getElementById('admin');
const adminButton = document.getElementById('done');

if (isAdmin()) {
  admin.style.display = 'block';
}

adminButton.addEventListener('click', async () => {
  const gameId = getGameId();
  await fetch(`/game/${encodeURIComponent(gameId)}/intermissionOver`, {
    method: 'POST',
    headers: adminHeaders()
  });
});
