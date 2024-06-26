import WebSocketClient from "/resources/webSocketService.mjs";

document.addEventListener("DOMContentLoaded", () => {
  createPromptInputs();
  initializeWebSocket();
  document
    .getElementById("submit-button")
    .addEventListener("click", submitPrompts);
  document
    .getElementById("perplayer")
    .addEventListener("change", createPromptInputs);
});

function initializeWebSocket() {
  const wsClient = new WebSocketClient();

  wsClient.addMessageHandler((message) => {
    if (message === "Words") {
      window.location.reload();
    }
  });
}

function createPromptInputs() {
  const container = document.getElementById("prompt-container");
  const numberOfPrompts =
    parseInt(document.getElementById("perplayer").value, 10) || 9;
  const currentInputs = container.getElementsByTagName("input").length;
  var time = document.getElementById("duration");

  if (time.value < 1) {
    time.value = numberOfPrompts * 5;
    time.innerHTML = numberOfPrompts * 5;
  }

  if (numberOfPrompts > currentInputs) {
    for (let i = currentInputs; i < numberOfPrompts; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.classList.add("number-input");
      container.appendChild(input);
    }
  } else if (numberOfPrompts < currentInputs) {
    for (let i = currentInputs; i > numberOfPrompts; i--) {
      container.removeChild(container.lastChild);
    }
  }
}

function submitPrompts() {
  const promptContainer = document.getElementById("prompt-container");
  const promptInputs = promptContainer.getElementsByTagName("input");
  const time = document.getElementById("duration").value;
  const votes = document.getElementById("votes").value;
  const prompts = [];

  if (time < 1) {
    alert("Please enter a valid duration");
    return;
  }

  if (time < 10) {
    if (
      !confirm(
        "Are you sure you want to start the game with less than 10 minutes?"
      )
    ) {
      return;
    }
  } else if (time > 60) {
    if (
      !confirm(
        "Are you sure you want to start the game with more than 60 minutes?"
      )
    ) {
      return;
    }
  }

  if (votes == 0) {
    if (!confirm("Are you sure you want to start the game without voting?")) {
      return;
    }
  }

  for (let input of promptInputs) {
    if (input.value.trim() !== "") {
      prompts.push(input.value);
    }
  }

  const wordsPerPlayer = document.getElementById("perplayer").value || 9;

  const requestBody = {
    words: prompts,
    wordsPerPlayer: wordsPerPlayer,
    time: time,
    votesPerPlayer: votes,
  };

  fetch("/words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (response.status !== 200) {
        console.log(response);
        throw new Error(
          response.statusText +
            ". You might left out more words than were defined in the word list."
        );
      }
      return response.json();
    })
    .then((data) => {
      window.location.reload();
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
}
