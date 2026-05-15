import WebSocketClient from '/resources/webSocketService.mjs';
import { getGameId, getPlayerSession, playerHeaders } from '/resources/gameContext.mjs';

const wsClient = new WebSocketClient();

document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
    initializeWebSocket();
});

function initializeWebSocket() {
    wsClient.on('GAME_ENDED', () => window.location.reload());
    wsClient.on('PHOTO_DECLINED', () => loadPlayerData());
    wsClient.on('PHOTO_UPDATED', () => loadPlayerData());
}

async function loadPlayerData() {
    try {
        const player = getPlayerSession();
        if (!player) {
            window.location.reload();
            return;
        }

        const gameId = getGameId();
        const response = await fetch(`/word/${encodeURIComponent(gameId)}/player/${encodeURIComponent(player.id)}`, {
            headers: playerHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch prompts');
        }

        const data = await response.json();
        data.words.sort((a, b) => Number(a.completed) - Number(b.completed));

        renderPlayerList(data.words);
        updateProgress(data.words);
        renderTime(data.time);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function renderPlayerList(words) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    words.forEach(word => {
        const div = createPlayerItem(word);
        playerList.appendChild(div);
    });
}

function updateProgress(data) {
    const progressText = document.getElementById('progress');
    const completed = data.filter(word => word.completed).length;
    const total = data.length;
    progressText.textContent = `Progress: ${completed}/${total} completed`;
}

function createPlayerItem(word) {
    const div = document.createElement('div');
    div.classList.add('block', 'card');

    const h3 = document.createElement('h3');
    h3.textContent = word.label;

    const p = document.createElement('p');
    p.textContent = word.completed ? '✔ Completed' : 'Not completed yet';

    div.appendChild(h3);
    div.appendChild(p);

    div.addEventListener('click', () => handleFileUpload(word));

    return div;
}

function handleFileUpload(word) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const downscaledImage = await downscaleImage(file, 1920, 1080);
        const player = getPlayerSession();
        const formData = new FormData();
        formData.append('file', downscaledImage);
        formData.append('playerId', player.id);
        formData.append('wordId', word.id);

        try {
            const gameId = getGameId();
            const response = await fetch(`/photo/${encodeURIComponent(gameId)}`, {
                method: 'POST',
                body: formData,
                headers: playerHeaders({
                    'Accept': 'application/json',
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Error uploading file');
                return;
            }

            await loadPlayerData();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    input.click();
}

async function downscaleImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    height *= maxWidth / width;
                    width = maxWidth;
                } else {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.8);
        };

        img.onerror = (error) => {
            reject(error);
        };
    });
}

function renderTime(endDate) {
    const timeText = document.getElementById('time');
    const endTime = new Date(endDate).getTime();
    let timerInterval;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function updateTimer() {
        const currentTime = new Date().getTime();
        const timeLeft = Math.floor((endTime - currentTime) / 1000);

        if (timeLeft <= 0) {
            timeText.innerHTML = "Time's up!";
            clearInterval(timerInterval);
            return;
        }

        timeText.innerHTML = formatTime(timeLeft);
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}
