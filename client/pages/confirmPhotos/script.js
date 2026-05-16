import WebSocketClient from '/resources/webSocketService.mjs';
import {
  adminHeaders,
  getGameId,
  getPlayerSession,
  isAdmin,
  playerHeaders,
  storageKey
} from '/resources/gameContext.mjs';
import { FrontendGameMode, normalizeGameMode } from '/resources/gamemodes/modes.mjs';

let latestPhotoRenderRequest = 0;
let currentGameMode = FrontendGameMode.INDIVIDUAL;

document.addEventListener('DOMContentLoaded', async function () {
  await initializeGameMode();
  fetchPhotos();
  initializeWebSocket();
  localStorage.removeItem(storageKey('chatMessages'));
});

async function fetchPhotos() {
  const requestId = ++latestPhotoRenderRequest;
  try {
    const data = await getAllPhotos();
    const votesLeft = currentGameMode === FrontendGameMode.BOUNTY_HUNT ? 0 : await getUserVotes();

    if (requestId !== latestPhotoRenderRequest) {
      return;
    }

    renderPhotos(data, isAdmin(), votesLeft, requestId);
  } catch (error) {
    console.error('Error fetching photos:', error);
  }
}

function initializeWebSocket() {
  const wsClient = new WebSocketClient();
  wsClient.on('PHOTO_DECLINED', fetchPhotos);
  wsClient.on('PHOTO_UPDATED', fetchPhotos);
  if (currentGameMode !== FrontendGameMode.BOUNTY_HUNT) {
    wsClient.on('VOTES_UPDATED', fetchPhotos);
  }
  wsClient.on('GAME_WIN', () => window.location.reload());
}

async function initializeGameMode() {
  try {
    const gameId = getGameId();
    const response = await fetch(`/game/${encodeURIComponent(gameId)}/info`);
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    currentGameMode = normalizeGameMode(data.gameMode, FrontendGameMode.INDIVIDUAL);
    const hideVoting = currentGameMode === FrontendGameMode.BOUNTY_HUNT;
    document.getElementById('votes-info-block').style.display = hideVoting ? 'none' : 'block';
    document.getElementById('votes-left-block').style.display = hideVoting ? 'none' : 'block';
  } catch (error) {
    console.error('Failed to initialize game mode:', error);
  }
}

async function getAllPhotos() {
  const gameId = getGameId();
  const response = await fetch(`/photo/${encodeURIComponent(gameId)}/all`);
  if (!response.ok) {
    throw new Error('Failed to fetch photos');
  }
  return response.json();
}

async function getUserVotes() {
  const votesHeader = document.getElementById('votes-left');
  const player = getPlayerSession();

  if (!player) {
    votesHeader.innerHTML = 'Votes Left: 0';
    return 0;
  }

  const gameId = getGameId();
  const response = await fetch(`/word/${encodeURIComponent(gameId)}/votes/${encodeURIComponent(player.id)}`, {
    headers: playerHeaders()
  });

  if (!response.ok) {
    votesHeader.innerHTML = 'Votes Left: 0';
    return 0;
  }

  const votes = await response.json();
  const parsedVotes = parseInt(votes.votes, 10);
  votesHeader.innerHTML = `Votes Left: ${parsedVotes}`;
  return parsedVotes;
}

function createPhotoBlock(photo, canAdmin, votesLeft) {
  const photoBlock = document.createElement('div');
  photoBlock.className = 'block card';
  photoBlock.dataset.word = photo.wordId;
  photoBlock.dataset.player = photo.playerId;

  const title = document.createElement('h2');
  title.className = 'image-title';
  title.textContent = photo.word;

  const owner = document.createElement('p');
  owner.textContent = photo.teamName ? `${photo.playerName} (Team ${photo.teamName})` : photo.playerName;

  const img = document.createElement('img');
  img.className = 'confirm-photo';
  img.src = photo.photoUrl;
  img.alt = photo.word;

  photoBlock.appendChild(title);
  photoBlock.appendChild(owner);
  photoBlock.appendChild(img);

  if (photo.votes > 0) {
    const voteCount = document.createElement('p');
    voteCount.innerHTML = `Votes: ${photo.votes}`;
    photoBlock.appendChild(voteCount);
  }

  const currentPlayer = getPlayerSession();
  const samePlayer = currentPlayer?.id === photo.playerId;
  const sameTeam = currentPlayer?.teamName && currentPlayer.teamName === photo.teamName;

  if (currentGameMode !== FrontendGameMode.BOUNTY_HUNT && currentPlayer && !samePlayer && !sameTeam) {
    if (votesLeft > 0) {
      const votingDiv = document.createElement('div');
      votingDiv.className = 'voting';
      const voteButton = document.createElement('button');
      voteButton.className = 'button';
      voteButton.textContent = '✨ Star';
      voteButton.addEventListener('click', () =>
        handleVote(photo.wordId, photo.playerId)
      );
      votingDiv.appendChild(voteButton);
      photoBlock.appendChild(votingDiv);
    }
  }

  if (canAdmin) {
    const adminDiv = createAdminDiv(photo, photoBlock);
    renderConfirmButton();
    photoBlock.appendChild(adminDiv);
  }

  return photoBlock;
}

function createAdminDiv(photo, photoBlock) {
  const adminDiv = document.createElement('div');
  adminDiv.className = 'admin';

  const declineButton = document.createElement('button');
  declineButton.className = 'decline-button';
  declineButton.textContent = 'Decline Photo';

  declineButton.addEventListener('click', () =>
    handleDecline(photo, photoBlock)
  );

  adminDiv.appendChild(declineButton);
  return adminDiv;
}

async function handleDecline(photo, photoBlock) {
  const gameId = getGameId();
  const declineData = {
    playerId: photo.playerId,
    wordId: photo.wordId,
  };

  try {
    const response = await fetch(`/photo/${encodeURIComponent(gameId)}/decline`, {
      method: 'POST',
      headers: adminHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(declineData),
    });

    if (response.ok) {
      photoBlock.remove();
    } else {
      const data = await response.json().catch(() => ({}));
      console.error(data.message || 'Failed to decline photo');
    }
  } catch (error) {
    console.error('Error declining photo:', error);
  }
}

async function handleVote(wordId, receivingPlayerId) {
  const gameId = getGameId();
  const voteData = {
    wordId,
    receivingPlayerId,
  };

  try {
    const response = await fetch(`/word/${encodeURIComponent(gameId)}/vote`, {
      method: 'POST',
      headers: playerHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(voteData),
    });

    if (response.ok) {
      fetchPhotos();
    } else {
      const data = await response.json().catch(() => ({}));
      alert(data.message || 'Failed to cast vote');
    }
  } catch (error) {
    console.error('Error casting vote:', error);
    alert('Error casting vote');
  }
}

function renderPhotos(data, canAdmin, votesLeft, requestId) {
  const photoContainer = document.querySelector('.photoContainer');
  photoContainer.innerHTML = '';

  for (const photo of data) {
    if (requestId !== latestPhotoRenderRequest) {
      return;
    }
    const photoBlock = createPhotoBlock(photo, canAdmin, votesLeft);
    photoContainer.appendChild(photoBlock);
  }
}

function renderConfirmButton() {
  const doneButton = document.getElementById('done');
  const doneContainer = document.getElementById('doneContainer');

  doneContainer.style.display = 'block';

  if (doneButton.dataset.bound === 'true') {
    return;
  }

  doneButton.dataset.bound = 'true';
  doneButton.addEventListener('click', async () => {
    try {
      const gameId = getGameId();
      await fetch(`/game/${encodeURIComponent(gameId)}/confirmReview`, {
        method: 'POST',
        headers: adminHeaders()
      });
    } catch (error) {
      console.error('Error confirming review:', error);
    }
  });
}
