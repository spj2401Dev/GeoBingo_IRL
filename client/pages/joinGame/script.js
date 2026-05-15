import WebSocketClient from '/resources/webSocketService.mjs';
import {
    adminHeaders,
    gamePageUrl,
    getGameId,
    isAdmin,
    setPlayerSession
} from '/resources/gameContext.mjs';

let isPlayerAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
    isPlayerAdmin = isAdmin();
    initializeQRCode();
    initializeWebSocket();
    setupJoinButton();
    fetchPlayers();
    document.getElementById('startButton').addEventListener('click', startGame);

    if (isPlayerAdmin) {
        playerIsAdmin();
    }
});

function initializeQRCode() {
    const gameId = getGameId();
    const joinUrl = `${window.location.origin}${gamePageUrl(gameId)}`;
    new QRCode(document.getElementById('qrcode'), {
        text: joinUrl,
        width: 250,
        height: 250,
        colorDark: '#fff',
        colorLight: '#2f2f35',
        correctLevel: QRCode.CorrectLevel.L
    });
}

function initializeWebSocket() {
    const wsClient = new WebSocketClient();
    wsClient.on('PLAYER_REFRESH', fetchPlayers);
    wsClient.on('GAME_STARTED', () => window.location.reload());
    wsClient.on('WORDS_UPDATED', () => window.location.reload());
}

function setupJoinButton() {
    const joinButton = document.getElementById('joinButton');
    joinButton.addEventListener('click', () => {
        const usernameInput = document.getElementById('username');
        const teamNameInput = document.getElementById('teamName');
        const isTeamCheckbox = document.getElementById('isTeam').checked;

        const username = usernameInput.value.trim();
        const teamName = isTeamCheckbox ? teamNameInput.value.trim() : '';

        if (!isValidName(username)) {
            alert('Please enter a valid username between 1 and 20 characters.');
            return;
        }

        if (isTeamCheckbox && !isValidName(teamName)) {
            alert('Please enter a valid team name between 1 and 20 characters.');
            return;
        }

        joinButton.disabled = true;
        addPlayer(username, teamName).finally(() => {
            joinButton.disabled = false;
        });
    });
}

function isValidName(value) {
    return value.length > 0 && value.length <= 20;
}

async function fetchPlayers() {
    try {
        const playersList = document.getElementById('players');
        playersList.innerHTML = '';
        const gameId = getGameId();

        const response = await fetch(`/player/${encodeURIComponent(gameId)}`, {
            method: 'GET'
        });

        if (response.ok) {
            const players = await response.json();
            players.forEach(player => {
                const li = document.createElement('li');
                li.textContent = player.teamName ? `${player.name} (Team ${player.teamName})` : player.name;
                playersList.appendChild(li);
            });
        } else {
            console.error('Failed to fetch players.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function addPlayer(username, teamName = '') {
    try {
        const gameId = getGameId();
        const response = await fetch(`/player/${encodeURIComponent(gameId)}`, {
            method: 'POST',
            headers: adminHeaders({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ username, teamName })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            setPlayerSession(data.player, data.playerToken);
            isPlayerAdmin = data.admin === true || isPlayerAdmin;

            if (isPlayerAdmin) {
                playerIsAdmin();
            }
        } else {
            alert(data.message || 'Failed to add player.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function startGame() {
    if (!isPlayerAdmin) {
        alert('Only the game creator can start the game.');
        return;
    }

    try {
        const gameId = getGameId();
        const response = await fetch(`/game/${encodeURIComponent(gameId)}/start`, {
            method: 'POST',
            headers: adminHeaders()
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const data = await response.json().catch(() => ({}));
            alert(data.message || 'Failed to start the game.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function playerIsAdmin() {
    const adminDiv = document.getElementById('admin');
    adminDiv.style.display = 'block';
}

document.getElementById('isTeam').addEventListener('change', function() {
    const teamNameContainer = document.getElementById('teamNameContainer');
    if (this.checked) {
        teamNameContainer.classList.remove('hidden');
    } else {
        teamNameContainer.classList.add('hidden');
    }
});
