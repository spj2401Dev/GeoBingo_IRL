import WebSocketClient from '/resources/webSocketService.mjs';
import { getGameId, getPlayerSession, playerHeaders } from '/resources/gameContext.mjs';
import { FrontendGameMode, normalizeGameMode } from '/resources/gamemodes/modes.mjs';
import { getCameraModeAdapter } from '/resources/gamemodes/cameraModeAdapter.mjs';

const wsClient = new WebSocketClient();
let cameraModeAdapter = getCameraModeAdapter();
let timerIntervalHandle = null;
let bountySelectionIntervalHandle = null;
let currentGameMode = FrontendGameMode.INDIVIDUAL;
let currentBountyState = null;

document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
    initializeWebSocket();
});

function initializeWebSocket() {
    wsClient.on('GAME_ENDED', () => window.location.reload());
    wsClient.on('PHOTO_DECLINED', () => loadPlayerData());
    wsClient.on('PHOTO_UPDATED', () => loadPlayerData());
    wsClient.on('BOUNTY_UPDATED', () => loadPlayerData());
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
        const words = Array.isArray(data.words) ? [...data.words] : [];
        words.sort((a, b) => Number(a.completed) - Number(b.completed));

        currentGameMode = normalizeGameMode(data.gameMode, FrontendGameMode.INDIVIDUAL);
        currentBountyState = data.bounty || null;
        cameraModeAdapter = getCameraModeAdapter(currentGameMode);

        renderPlayerList(words, player.id);
        updateProgress(words);
        renderBountyPanel(player.id);
        renderTime(data.time);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function renderPlayerList(words, playerId) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';

    if (words.length === 0 && currentGameMode === FrontendGameMode.BOUNTY_HUNT) {
        const info = document.createElement('div');
        info.className = 'block card centered';
        info.textContent = currentBountyState?.phase === 'selection'
            ? 'Waiting for the next bounty selection...'
            : 'No active bounty at the moment.';
        playerList.appendChild(info);
        return;
    }

    words.forEach((word) => {
        const div = createPlayerItem(word, playerId);
        playerList.appendChild(div);
    });
}

function updateProgress(words) {
    const progressText = document.getElementById('progress');
    progressText.textContent = cameraModeAdapter.getProgressText(words, currentBountyState);
}

function createPlayerItem(word, playerId) {
    const div = document.createElement('div');
    div.classList.add('block', 'card');

    const h3 = document.createElement('h3');
    h3.textContent = word.label;
    if (cameraModeAdapter.shouldCrossWord(word, playerId, currentBountyState)) {
        h3.classList.add('prompt-completed-cross');
    }

    const p = document.createElement('p');
    p.textContent = cameraModeAdapter.getWordStatusText(word, playerId, currentBountyState);

    div.appendChild(h3);
    div.appendChild(p);

    if (cameraModeAdapter.canUploadPhoto(word, playerId, currentBountyState)) {
        div.addEventListener('click', () => handleFileUpload(word));
    } else {
        div.classList.add('word-item-disabled');
    }

    return div;
}

function handleFileUpload(word) {
    const player = getPlayerSession();
    if (!player || !cameraModeAdapter.canUploadPhoto(word, player.id, currentBountyState)) {
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const downscaledImage = await downscaleImage(file, 1920, 1080);
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
    if (timerIntervalHandle) {
        clearInterval(timerIntervalHandle);
        timerIntervalHandle = null;
    }

    if (!endDate) {
        timeText.innerHTML = '00:00';
        return;
    }

    const endTime = new Date(endDate).getTime();

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
            if (timerIntervalHandle) {
                clearInterval(timerIntervalHandle);
                timerIntervalHandle = null;
            }
            return;
        }

        timeText.innerHTML = formatTime(timeLeft);
    }

    updateTimer();
    timerIntervalHandle = setInterval(updateTimer, 1000);
}

function renderBountyPanel(playerId) {
    const panel = document.getElementById('bounty-panel');
    if (currentGameMode !== FrontendGameMode.BOUNTY_HUNT) {
        panel.classList.add('hidden');
        stopBountySelectionCountdown();
        return;
    }

    panel.classList.remove('hidden');
    const phaseText = document.getElementById('bounty-phase');
    const scoreText = document.getElementById('bounty-score');
    const selectionTimerText = document.getElementById('bounty-selection-timer');
    const candidatesContainer = document.getElementById('bounty-candidates');
    const skipButton = document.getElementById('bounty-skip-button');

    const phase = currentBountyState?.phase || 'hunt';
    if (phase === 'selection') {
        phaseText.textContent = 'Next bounty selection!';
    } else if (phase === 'finished') {
        phaseText.textContent = 'All bounties are completed';
    } else {
        phaseText.textContent = 'Active bounty';
    }

    const score = Number.parseInt(currentBountyState?.score || 0, 10) || 0;
    const scoreKind = currentBountyState?.scoreKind === 'team' ? 'Team score' : 'Your score';
    scoreText.textContent = `${scoreKind}: ${score}`;

    candidatesContainer.innerHTML = '';
    if (Array.isArray(currentBountyState?.selectionCandidates) && currentBountyState.selectionCandidates.length > 0) {
        if (currentBountyState.canSelect) {
            currentBountyState.selectionCandidates.forEach((label) => {
                const button = document.createElement('button');
                button.className = 'button';
                button.textContent = label;
                button.addEventListener('click', () => chooseNextBounty(label));
                candidatesContainer.appendChild(button);
            });
        } else {
            const info = document.createElement('p');
            info.className = 'centered';
            info.textContent = 'Waiting for the claiming player/team to choose the next bounty...';
            candidatesContainer.appendChild(info);
        }
    }

    const canSkip = Boolean(currentBountyState?.skipEnabled && currentBountyState?.canSkip && phase === 'hunt');
    skipButton.classList.toggle('hidden', !canSkip);
    if (canSkip) {
        skipButton.onclick = () => skipActiveBounty();
    } else {
        skipButton.onclick = null;
    }

    if (phase === 'selection' && currentBountyState?.selectionEndsAt) {
        startBountySelectionCountdown(currentBountyState.selectionEndsAt, selectionTimerText);
    } else {
        stopBountySelectionCountdown();
        selectionTimerText.textContent = '';
    }
}

function startBountySelectionCountdown(selectionEndsAt, targetElement) {
    stopBountySelectionCountdown();
    const endTs = new Date(selectionEndsAt).getTime();

    function updateSelectionCountdown() {
        const msLeft = endTs - Date.now();
        if (msLeft <= 0) {
            targetElement.textContent = 'Picking random prompt...';
            stopBountySelectionCountdown();
            return;
        }
        targetElement.textContent = `Selection ends in ${Math.ceil(msLeft / 1000)}s`;
    }

    updateSelectionCountdown();
    bountySelectionIntervalHandle = setInterval(updateSelectionCountdown, 500);
}

function stopBountySelectionCountdown() {
    if (bountySelectionIntervalHandle) {
        clearInterval(bountySelectionIntervalHandle);
        bountySelectionIntervalHandle = null;
    }
}

async function chooseNextBounty(label) {
    try {
        const gameId = getGameId();
        const response = await fetch(`/word/${encodeURIComponent(gameId)}/bounty/select`, {
            method: 'POST',
            headers: playerHeaders({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ label })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(data.message || 'Failed to select the next bounty');
            return;
        }

        await loadPlayerData();
    } catch (error) {
        console.error('Error selecting next bounty:', error);
    }
}

async function skipActiveBounty() {
    try {
        const gameId = getGameId();
        const response = await fetch(`/word/${encodeURIComponent(gameId)}/bounty/skip`, {
            method: 'POST',
            headers: playerHeaders({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(data.message || 'Failed to skip the active bounty');
            return;
        }

        await loadPlayerData();
    } catch (error) {
        console.error('Error skipping bounty:', error);
    }
}
