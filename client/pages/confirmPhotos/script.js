import WebSocketClient from '/resources/webSocketService.mjs';

document.addEventListener("DOMContentLoaded", function() {
    fetchPhotos();
    initializeWebSocket();
});

async function fetchPhotos() {
    try {
        const data = await getAllPhotos();
        const isAdmin = JSON.parse(localStorage.getItem("isAdmin"));
        const currentUser = localStorage.getItem("username"); // assuming you store the current username in localStorage
        const votesLeft = await getVotesLeft(currentUser);

        renderPhotos(data, isAdmin, currentUser, votesLeft);
    } catch (error) {
        console.error("Error fetching photos:", error);
    }
}

function initializeWebSocket() {
    const wsClient = new WebSocketClient();

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

async function getVotesLeft(username) {
    const response = await fetch(`/vote/${username}`);
    if (!response.ok) {
        throw new Error("Failed to fetch votes left");
    }
    return response.text(); // Assuming the response is a plain number in text format
}

function createPhotoBlock(word, player, isAdmin, currentUser, votesLeft) {
    const photoBlock = document.createElement("div");
    photoBlock.className = "block card";

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

    if (player.player !== currentUser && votesLeft > 0) {
        const votingDiv = createVotingDiv(word.word, player.player, currentUser);
        photoBlock.appendChild(votingDiv);
    }

    return photoBlock;
}

function createVotingDiv(word, receivingPlayer, sendingPlayer) {
    const votingDiv = document.createElement("div");
    votingDiv.className = "voting";

    const voteButton = document.createElement("button");
    voteButton.className = "button";
    voteButton.textContent = "✨ Star";

    voteButton.addEventListener("click", () => handleVote(word, receivingPlayer, sendingPlayer));

    votingDiv.appendChild(voteButton);

    return votingDiv;
}

async function handleVote(word, receivingPlayer, sendingPlayer) {
    const voteData = {
        word: word,
        receivingPlayer: receivingPlayer,
        sendingPlayer: sendingPlayer
    };

    try {
        const response = await fetch("/vote", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(voteData)
        });

        if (response.ok) {
            // Optionally, update the UI to reflect the vote was successful
            fetchPhotos(); // Refresh photos to update votes left and disable button if no votes left
        } else {
            console.error("Failed to submit vote");
        }
    } catch (error) {
        console.error("Error submitting vote:", error);
    }
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
        word: word.word
    };

    try {
        const response = await fetch("/declinePhoto", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(declineData)
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

function renderPhotos(data, isAdmin, currentUser, votesLeft) {
    const photoContainer = document.querySelector(".photoContainer");
    photoContainer.innerHTML = "";

    data.forEach((player) => {
        player.words.forEach((word) => {
            const photoBlock = createPhotoBlock(word, player, isAdmin, currentUser, votesLeft);
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
            console.error("Error confirming review:", error);
        }
    });
}
