document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
});

async function loadPlayerData() {
    try {
        var player = await localStorage.getItem('username');
        const response = await fetch('/getWordsForPlayer/' + player);
        const data = await response.json();
        renderPlayerList(data.words);
        updateProgress(data.words);
        RenderTime(data.time);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function renderPlayerList(players) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    players.forEach(player => {
        const div = createPlayerItem(player);
        playerList.appendChild(div);
    });
}

function updateProgress(data) {
    const progressText = document.getElementById('progress');
    const completed = data.filter(player => player.completed).length;
    const total = data.length;
    progressText.textContent = `Progress: ${completed}/${total} completed`;
}

function createPlayerItem(player) {
    const div = document.createElement('div');
    div.classList.add('block', 'card');

    const h3 = document.createElement('h3');
    h3.textContent = player.Label;

    const p = document.createElement('p');
    p.textContent = player.completed ? 'Completed' : 'Not completed yet';

    div.appendChild(h3);
    div.appendChild(p);

    div.addEventListener('click', () => handleFileUpload(player));

    return div;
}

function handleFileUpload(player) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        var username = await localStorage.getItem('username');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('playername', username);
        formData.append('word', player.Label);

        try {
            const response = await fetch('/photo', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                }
            });
            const data = await response.json();
            await loadPlayerData();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    input.click();
}

function RenderTime(endDate) {
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