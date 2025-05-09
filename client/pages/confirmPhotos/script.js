import WebSocketClient from "/resources/webSocketService.mjs";

document.addEventListener("DOMContentLoaded", function () {
  fetchPhotos();
  initializeWebSocket();
  localStorage.removeItem("chatMessages"); // Clear chat messages after gameEnded page is exited, to make sure chat is empty when game starts again (This has issues, but it should be fine)
});

async function fetchPhotos() {
  try {
    const data = await getAllPhotos();
    const isAdmin = JSON.parse(localStorage.getItem("isAdmin"));

    getUserVotes(localStorage.getItem("username"));
    renderPhotos(data, isAdmin);
  } catch (error) {
    console.error("Error fetching photos:", error);
  }
}

function initializeWebSocket() {
  const wsClient = new WebSocketClient();
  wsClient.on('PHOTO_DECLINED', fetchPhotos);
  wsClient.on('VOTES_UPDATED', fetchPhotos);
  wsClient.on('GAME_WIN', () => window.location.reload());
}

async function getAllPhotos() {
  const response = await fetch("/photo/all");
  if (!response.ok) {
    throw new Error("Failed to fetch photos");
  }
  return response.json();
}

async function getUserVotes(username) {
  const votesHeader = document.getElementById("votes-left");
  const response = await fetch(`/word/votes/${username}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user votes");
  }
  const votes = await response.json();
  var parsedVotes = parseInt(votes.votes, 10);
  votesHeader.innerHTML = `Votes Left: ${parsedVotes}`;
  return parsedVotes;
}

async function createPhotoBlock(word, player, isAdmin) {
  const photoBlock = document.createElement("div");
  photoBlock.className = "block card";
  photoBlock.dataset.word = word.word;
  photoBlock.dataset.player = player.player;

  const title = document.createElement("h2");
  title.className = "image-title";
  title.textContent = word.word;

  const img = document.createElement("img");
  img.className = "confirm-photo";
  img.src = `/${word.photo}`;
  img.alt = word.word;

  photoBlock.appendChild(title);
  photoBlock.appendChild(img);

  if (isAdmin) {
    const adminDiv = createAdminDiv(player, word, photoBlock);
    renderConfirmButton(isAdmin);
    photoBlock.appendChild(adminDiv);
  }

  if (word.votes > 0) {
    const voteCount = document.createElement("p");
    voteCount.innerHTML = `Votes: ${word.votes}`;
    photoBlock.appendChild(voteCount);
  }

  const currentUsername = localStorage.getItem("username");
  if (player.player !== currentUsername) {
    const votes = await getUserVotes(currentUsername);
    if (votes > 0) {
      const votingDiv = document.createElement("div");
      votingDiv.className = "voting";
      const voteButton = document.createElement("button");
      voteButton.className = "button";
      voteButton.textContent = "✨ Star";
      voteButton.addEventListener("click", () =>
        handleVote(word.word, player.player, currentUsername)
      );
      votingDiv.appendChild(voteButton);
      photoBlock.appendChild(votingDiv);
    }
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
    const response = await fetch("/photo/decline", {
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

async function handleVote(word, receivingPlayer, sendingPlayer) {
  const voteData = {
    word: word,
    receivingPlayer: receivingPlayer,
    sendingPlayer: sendingPlayer,
  };

  try {
    const response = await fetch("/word/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(voteData),
    });

    if (response.ok) {
      fetchPhotos();
    } else {
      alert("Failed to cast vote");
    }
  } catch (error) {
    console.error("Error casting vote:", error);
    alert("Error casting vote");
  }
}

async function renderPhotos(data, isAdmin) {
  const photoContainer = document.querySelector(".photoContainer");
  const existingBlocks = Array.from(photoContainer.children);

  const currentWords = new Set(data.flatMap(player => player.words.map(word => `${word.word}-${player.player}`)));

  for (const player of data) {
    for (const word of player.words) {
      const wordPlayerKey = `${word.word}-${player.player}`;
      const existingBlock = existingBlocks.find(block => block.dataset.word === word.word && block.dataset.player === player.player);

      if (existingBlock) {
        updatePhotoBlock(existingBlock, word, player, isAdmin);
        const index = existingBlocks.indexOf(existingBlock);
        if (index > -1) {
          existingBlocks.splice(index, 1);
        }
      } else {
        const photoBlock = await createPhotoBlock(word, player, isAdmin);
        photoContainer.appendChild(photoBlock);
      }
    }
  }

  existingBlocks.forEach(block => {
    const wordPlayerKey = `${block.dataset.word}-${block.dataset.player}`;
    if (!currentWords.has(wordPlayerKey)) {
      block.remove();
    }
  });
}

function updatePhotoBlock(block, word, player, isAdmin) {
  const title = block.querySelector(".image-title");
  title.textContent = word.word;

  const img = block.querySelector(".confirm-photo");
  img.src = `/${word.photo}`;
  img.alt = word.word;

  const voteCount = block.querySelector("p");
  if (word.votes > 0) {
    if (voteCount) {
      voteCount.innerHTML = `Votes: ${word.votes}`;
    } else {
      const newVoteCount = document.createElement("p");
      newVoteCount.innerHTML = `Votes: ${word.votes}`;
      block.appendChild(newVoteCount);
    }
  } else if (voteCount) {
    voteCount.remove();
  }

  if (isAdmin) {
    if (!block.querySelector(".admin")) {
      const adminDiv = createAdminDiv(player, word, block);
      renderConfirmButton(isAdmin);
      block.appendChild(adminDiv);
    }
  } else {
    const adminDiv = block.querySelector(".admin");
    if (adminDiv) {
      adminDiv.remove();
    }
  }
}

function renderConfirmButton(isAdmin) {
  if (!isAdmin) return;

  const doneButton = document.getElementById("done");
  const doneContainer = document.getElementById("doneContainer");

  doneContainer.style.display = "block";

  doneButton.addEventListener("click", async () => {
    try {
      await fetch("/game/confirmReview", { method: "POST" });
    } catch (error) {
      console.error("Error confirming review:", error);
    }
  });
}
