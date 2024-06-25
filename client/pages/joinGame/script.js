import WebSocketClient from '/resources/webSocketService.mjs';

var isPlayerAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeQRCode();
    initializeWebSocket();
    setupJoinButton();
    fetchPlayers();
    document.getElementById('startButton').addEventListener('click', startGame);
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
    const wsClient = new WebSocketClient();
    
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
        
        if (response.status === 200) {
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

        if (response.status === 200) {
            const data = await response.json();
            localStorage.setItem('username', username);
            if (data.admin === true) {
                isPlayerAdmin = true; // Yea, its unsecure. But worst that can happen is that the user can start the game.
                playerisAdmin();
            }
            await localStorage.setItem('isAdmin', data.admin);
        } else {
            alert('Failed to add player.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function startGame() {
    if (!isPlayerAdmin) { 
        alert('Only the admin can start the game.');
        return;
    }

    try {
        const response = await fetch('/startGame', {
            method: 'POST'
        });

        if (response.ok) {
            window.location.reload()
        } else {
            alert('Failed to start the game.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function playerisAdmin() {
    const adminDiv = document.getElementById('admin');
    adminDiv.style.display = 'block';
}