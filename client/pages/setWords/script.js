document.addEventListener("DOMContentLoaded", () => {
    createPromptInputs();
    document.getElementById("submit-button").addEventListener("click", submitPrompts);
});

function createPromptInputs() {
    const container = document.getElementById("prompt-container");
    const numberOfPrompts = parseInt(document.getElementById("perplayer").value, 10) || 9;
    const currentInputs = container.getElementsByTagName("input").length;

    if (numberOfPrompts > currentInputs) {
        for (let i = currentInputs; i < numberOfPrompts; i++) {
            const input = document.createElement("input");
            input.type = "text";
            input.classList.add("number-input");
            container.appendChild(input);
        }
    } else if (numberOfPrompts < currentInputs) {
        for (let i = currentInputs; i > numberOfPrompts; i--) {
            container.removeChild(container.lastChild);
        }
    }
}

function submitPrompts() {
    const promptContainer = document.getElementById("prompt-container");
    const promptInputs = promptContainer.getElementsByTagName("input");
    const prompts = [];

    for (let input of promptInputs) {
        if (input.value.trim() !== "") {
            prompts.push(input.value);
        }
    }

    const wordsPerPlayer = document.getElementById("perplayer").value || 9;

    const requestBody = {
        words: prompts,
        wordsPerPlayer: wordsPerPlayer
    };

    fetch("/words", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => response.json())
        .then(data => {
            window.location.reload();
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error" + error.message)
        });
}
