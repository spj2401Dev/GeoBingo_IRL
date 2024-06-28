if (localStorage.getItem("isAdmin") === "true") {
  document.getElementById("admin").style.display = "block";
  document.getElementById("reset").addEventListener("click", async () => {
    await fetch("/resetGame", {
      method: "GET",
    });
    window.location.href = "/";
  });
}

fetch("/getWinner")
  .then((response) => response.json())
  .then((data) => {
    const winners = [];
    let currentRank = 1;

    for (let i = 0; i < data.length; i++) {
      if (i > 0 && data[i].totalScore !== data[i - 1].totalScore) {
        currentRank = i + 1;
      }
      winners.push({
        rank: currentRank,
        name: data[i].player,
        score: data[i].completedPhotos,
        votes: data[i].votesScore,
        totalScore : data[i].totalScore,
        isTeam: data[i].isTeam,
      });
    }

    const cardWrapper = document.getElementById("winner-cards");
    let allCardsHtml = "";

    winners.forEach((winner, index) => {
      if (index === 0) {
        if (winner.isTeam == true) {
          winner.name = "Team " + winner.name;
        }

        allCardsHtml += `
    <div class="block card">
      <h1 class="header-text">🥇 First Place:</h1>
      <p><strong>${winner.name}</strong></p>
      <p>With a Score of: ${winner.totalScore} Points</p>
    </div>`;
      } else {
        allCardsHtml += `
    <div class="block card">
      <p>${winner.rank}. <strong>${winner.name}</strong> (${winner.totalScore} Points)</p>
    </div>`;
      }
    });

    cardWrapper.innerHTML = allCardsHtml;
  })
  .catch((error) => console.error("Error:", error));
