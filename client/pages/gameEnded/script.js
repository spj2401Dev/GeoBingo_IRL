import WebSocketClient from "/resources/webSocketService.mjs";

const wsClient = new WebSocketClient();
const chatContainer = document.getElementById("chatContainer");
const sendButton = document.getElementById("sendButton");
const messageInput = document.getElementById("messageInput");

function addMessage(username, message) {
  const messageBlock = document.createElement("div");
  messageBlock.classList.add("block", "card");
  messageBlock.innerHTML = `
                <h1 class="chat-header-text">${username}</h1>
                <p>${message}</p>
            `;
  chatContainer.insertBefore(messageBlock, chatContainer.firstChild);
}

function storeMessage(username, message) {
  const messages = JSON.parse(localStorage.getItem("chatMessages") || "[]");
  messages.push({ username, message, timestamp: Date.now() });
  localStorage.setItem("chatMessages", JSON.stringify(messages));
}

function loadMessages() {
  const messages = JSON.parse(localStorage.getItem("chatMessages") || "[]");
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const recentMessages = messages.filter(
    (msg) => msg.timestamp > tenMinutesAgo
  );
  recentMessages.forEach((msg) => addMessage(msg.username, msg.message));
}

window.addEventListener("load", loadMessages);

wsClient.addMessageHandler((message) => {
  if (message == "Reload") {
    window.location.reload();
    return;
  }

  const parsedMessage = JSON.parse(message);
  addMessage(parsedMessage.username, parsedMessage.text);
  storeMessage(parsedMessage.username, parsedMessage.text);
});

sendButton.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (message) {
    const username = (await localStorage.getItem("username")) || "Anonymous";
    const messageObject = { username, text: message };
    await wsClient.sendMessage(JSON.stringify(messageObject));
    // Websocket sends message to all clients, so we need to add the message to our own chat
    messageInput.value = "";
  }
});

const isAdmin = localStorage.getItem("isAdmin");
const admin = document.getElementById("admin");
const adminButton = document.getElementById("done");

if (isAdmin) {
  admin.style.display = "block";
}

adminButton.addEventListener("click", async () => {
  fetch("/intermissionOver", {
    method: "POST",
  })
});
