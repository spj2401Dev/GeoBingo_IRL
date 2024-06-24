import WebSocketClient from '/resources/webSocketService.mjs';

document.addEventListener("DOMContentLoaded", function() {
    fetchPhotos();
    initializeWebSocket();
  });

async function fetchPhotos() {
  try {
    const data = await getAllPhotos();
    const isAdmin = JSON.parse(localStorage.getItem("isAdmin"));

    renderPhotos(data, isAdmin);
  } catch (error) {
    console.error("Error fetching photos:", error);
  }
}

function initializeWebSocket() {
    const wsClient = new WebSocketClient('ws://192.168.178.123:8080');
    
    wsClient.addMessageHandler((message) => {
        if (message === 'Decline') {
            fetchPhotos();
        } else if (message === "Win") {
            window.location.reload();
        }
    });
}

async function getAllPhotos() {
  const response = await fetch("/allPhotos");
  if (!response.ok) {
    throw new Error("Failed to fetch photos");
  }
  return response.json();
}

function createPhotoBlock(word, player, isAdmin) {
  const photoBlock = document.createElement("div");
  photoBlock.className = "block card";

  const title = document.createElement("h2");
  title.className = "image-title";
  title.textContent = word.word;

  const img = document.createElement("img");
  img.className = "confirm-photo";
  img.src = `/${word.photo.split("data\\photos\\").pop()}`;
  img.alt = word.word;

  photoBlock.appendChild(title);
  photoBlock.appendChild(img);

  if (isAdmin) {
    const adminDiv = createAdminDiv(player, word, photoBlock);
    renderConfirmButton(isAdmin);
    photoBlock.appendChild(adminDiv);
  }

  return photoBlock;
}

function createAdminDiv(player, word, photoBlock) {
  const adminDiv = document.createElement("div");
  adminDiv.className = "admin";

  const declineButton = document.createElement("button");
  declineButton.className = "decline-button";
  declineButton.textContent = "Decline Photo";

  declineButton.addEventListener("click", () =>
    handleDecline(player, word, photoBlock)
  );

  adminDiv.appendChild(declineButton);

  return adminDiv;
}

async function handleDecline(player, word, photoBlock) {
  const declineData = {
    playername: player.player,
    word: word.word,
  };

  try {
    const response = await fetch("/declinePhoto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(declineData),
    });

    if (response.ok) {
      photoBlock.remove();
    } else {
      console.error("Failed to decline photo");
    }
  } catch (error) {
    console.error("Error declining photo:", error);
  }
}

function renderPhotos(data, isAdmin) {
  const photoContainer = document.querySelector(".photoContainer");
  photoContainer.innerHTML = "";

  data.forEach((player) => {
    player.words.forEach((word) => {
      const photoBlock = createPhotoBlock(word, player, isAdmin);
      photoContainer.appendChild(photoBlock);
    });
  });
}

function renderConfirmButton(isAdmin) {
  if (!isAdmin) return;

  const doneButton = document.getElementById("done");
  const doneContainer = document.getElementById("doneContainer");

  doneContainer.style.display = "block";

  doneButton.addEventListener("click", async () => {
    try {
      await fetch("/confirmReview", { method: "GET" });
    } catch (error) {

    }
  });
}