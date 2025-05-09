if (localStorage.getItem("isAdmin") === "true") {
  document.getElementById("admin").style.display = "block";
  document.getElementById("reset").addEventListener("click", async () => {
    await fetch("/game/reset", {
      method: "POST",
    });
    window.location.href = "/";
  });
}

fetch("/game/winner")
  .then((response) => response.json())
  .then((data) => {
    const rankingsData = data.rankings || [];
    const sendData = data.sendData || null;
    
    const winners = [];
    let currentRank = 1;

    for (let i = 0; i < rankingsData.length; i++) {
      if (i > 0 && rankingsData[i].totalScore !== rankingsData[i - 1].totalScore) {
        currentRank = i + 1;
      }
      winners.push({
        rank: currentRank,
        name: rankingsData[i].player,
        score: rankingsData[i].completedPhotos,
        votes: rankingsData[i].votesScore,
        totalScore: rankingsData[i].totalScore,
        isTeam: rankingsData[i].isTeam,
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
    
    if (sendData && sendData.success === true && sendData.downloadLink) {
      const photoSection = document.createElement('div');
      photoSection.className = 'block card';
      photoSection.innerHTML = `
        <h2 class="header-text">Photos</h2>
        <p>All the Game Photos were uploaded to Send. You can access them here: </p>
        <p><a href="${sendData.downloadLink}" target="_blank" class="download-link">${sendData.downloadLink}</a></p>
      `;
      
      cardWrapper.parentNode.insertBefore(photoSection, cardWrapper.nextSibling);
    }
  })
  .catch((error) => console.error("Error:", error));
