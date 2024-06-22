document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
});

async function loadPlayerData() {
    try {
        const response = await fetch('/getWordsForPlayer/Jakob');
        const data = await response.json();
        renderPlayerList(data);
        updateProgress(data);
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
    p.textContent = player.completed ? 'Already completed' : 'Not completed yet';

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

        const formData = new FormData();
        formData.append('file', file);
        formData.append('playername', 'Jakob');
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
