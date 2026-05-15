import { adminHeaders, gamePageUrl, getGameId, isAdmin } from '/resources/gameContext.mjs';

const gameId = getGameId();

if (isAdmin()) {
  document.getElementById('admin').style.display = 'block';
  document.getElementById('reset').addEventListener('click', async () => {
    await fetch(`/game/${encodeURIComponent(gameId)}/reset`, {
      method: 'POST',
      headers: adminHeaders()
    });
    window.location.href = gamePageUrl(gameId);
  });
}

fetch(`/game/${encodeURIComponent(gameId)}/winner`)
  .then((response) => response.json())
  .then((data) => {
    const rankingsData = data.rankings || [];

    const winners = [];
    let currentRank = 1;

    for (let i = 0; i < rankingsData.length; i += 1) {
      if (i > 0 && rankingsData[i].totalScore !== rankingsData[i - 1].totalScore) {
        currentRank = i + 1;
      }
      winners.push({
        rank: currentRank,
        name: rankingsData[i].name,
        score: rankingsData[i].completedPhotos,
        votes: rankingsData[i].votesScore,
        penaltyPoints: rankingsData[i].penaltyPoints,
        totalScore: rankingsData[i].totalScore,
        isTeam: rankingsData[i].isTeam,
      });
    }

    const cardWrapper = document.getElementById('winner-cards');
    let allCardsHtml = '';

    winners.forEach((winner, index) => {
      const winnerName = winner.isTeam ? `Team ${winner.name}` : winner.name;
      const penaltyText = winner.penaltyPoints > 0 ? `, ${winner.penaltyPoints} penalty` : '';

      if (index === 0) {
        allCardsHtml += `
    <div class="block card">
      <h1 class="header-text">🥇 First Place:</h1>
      <p><strong>${winnerName}</strong></p>
      <p>With a Score of: ${winner.totalScore} Points</p>
    </div>`;
      } else {
        allCardsHtml += `
    <div class="block card">
      <p>${winner.rank}. <strong>${winnerName}</strong> (${winner.totalScore} Points${penaltyText})</p>
    </div>`;
      }
    });

    cardWrapper.innerHTML = allCardsHtml;
  })
  .catch((error) => console.error('Error:', error));
