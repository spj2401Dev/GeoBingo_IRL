import WebSocketClient from '/resources/webSocketService.mjs';

document.addEventListener('DOMContentLoaded', () => {
    initializeQRCode();
    initializeWebSocket();
    setupJoinButton();
    fetchPlayers();
});

function initializeQRCode() {
    new QRCode(document.getElementById('qrcode'), {
        text: window.location.href,
        width: 250,
        height: 250,
        colorDark: '#fff',
        colorLight: '#2f2f35',
        correctLevel: QRCode.CorrectLevel.L
    });
}

function initializeWebSocket() {
    const wsClient = new WebSocketClient('ws://192.168.178.123:8080');
    
    wsClient.addMessageHandler((message) => {
        if (message === 'Player refresh') {
            fetchPlayers();
        } else if (message === "Start") {
            window.location.reload();
        }
    });
}

function setupJoinButton() {
    const joinButton = document.getElementById('joinButton');
    joinButton.addEventListener('click', () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();

        if (isValidUsername(username)) {
            joinButton.disabled = true;
            addPlayer(username);
        } else {
            alert('Please enter a username between 1 and 20 characters.');
        }
    });
}

function isValidUsername(username) {
    return username.length > 0 && username.length <= 20;
}

async function fetchPlayers() {
    try {
        const playersList = document.getElementById('players');
        playersList.innerHTML = '';
        
        const response = await fetch('/getPlayers');
        
        if (response.ok) {
            const players = await response.json();
            players.forEach(player => {
                const li = document.createElement('li');
                li.textContent = player;
                playersList.appendChild(li);
            });
        } else if (response.status === 204) {
            console.log('No players joined yet.');
        } else {
            console.error('Failed to fetch players.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function addPlayer(username) {
    try {
        const response = await fetch('/addPlayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            console.error('Failed to add player.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
