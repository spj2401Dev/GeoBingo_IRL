import { game } from "../models/game.mjs";
import { getWords } from "../controller/wordController.mjs"; // Bad practice
import { player as PlayerModel } from "../models/player.mjs";
import { word as WordModel } from "../models/word.mjs";

var players = game.players;

export async function addPlayer(playerName, team, votesPerPlayer) {
  let player = Object.assign({}, PlayerModel);
  var words = await getWords();

  player.name = playerName;

  if (team) {
    player.team = team;
  }

  if (votesPerPlayer) {
    player.votes = votesPerPlayer;
  }

  player.words = words.map((word, index) => {
    if (WordModel[index]) {
      return { ...WordModel[index], Label: word, completed: false, photo: "", votes: 0};
    } else {
      return { Label: word, completed: false, photo: "", votes: 0};
    }
  });

  if (players.length === 0) {
    player.isAdmin = true;
  }

  players.push(player);
}

export function modifyPlayer(player) {
  players.forEach((p) => {
    if (p.name == player.name) {
      p = player;
    } else {
      return;
    }
  });
}

export function getWordsFromPlayer(playerName) {
  const foundPlayer = players.find((p) => p.name === playerName);

  if (foundPlayer) {
    return foundPlayer.words;
  } else {
    return null;
  }
}
export function CheckIfPlayerExists(player) {
  players.forEach((p) => {
    if (p.name == player.name) {
      return true;
    }
  });

  return false;
}

export function AddImageToPlayer(image, player, word) {
  var targetPlayer = players.find(p => p.name == player);
  if (targetPlayer) {
    var targetWord = targetPlayer.words.find(w => w.Label === word);
    if (targetWord) {
      targetWord.photo = image;
      targetWord.completed = true;
    }
  }

  return;
}

export function GetPlayers() {
  if (players == null || players.length === 0) {
    return null;
  }
  return players.map(player => ({ name: player.name, team: player.team }));
}

export function GetFullPlayers() {
  if (players == null || players.length === 0) {
    return null;
  }
  return players;
}

export function DeclinePhoto(playername, word) {
  players.forEach((p) => {
    if (p.name == playername) {
      p.words.forEach((w) => {
        if (w.Label == word) {
          w.photo = null;
          w.completed = false;
        }
      });
    }
  });
}

export function GetWinner() {
  let rankList = [];

  players.forEach((p) => {
    if (!rankList.some((player) => player.player === p.name)) {
      let completedPhotos = p.words.filter((w) => w.completed === true);
      let votesScore = p.words.reduce((acc, word) => acc + word.votes, 0);
      let totalScore = completedPhotos.length + votesScore;

      rankList.push({
        player: p.name,
        completedPhotos: completedPhotos.length,
        votesScore: votesScore,
        totalScore: totalScore,
        isTeam: p.team !== ""
      });
    }
  });

  rankList.sort((a, b) => b.totalScore - a.totalScore);

  return rankList;
}


export function ResetPlayers() {
  players = [];
}

function PlayerHasEnoughVotes(playername) {
  let player = players.find((p) => p.name === playername);
  if (player == null) {
    return false;
  }
  return player.votes > 0;
}

function removeVote(playername) {
  let player = players.find((p) => p.name === playername);
  if (player == null) {
    return;
  }
  player.votes -= 1;
}

export function VoteForPlayer(playername) {
  if (PlayerHasEnoughVotes(playername)) {
    removeVote(playername);
    return true;
  } else {
    return false;
  }
}

export function AddVoteToWord(word, playername, amount = 1) {
  let player = players.find((p) => p.name === playername);
  if (!player) {
    return;
  }
  let targetWord = player.words.find((w) => w.Label === word);
  if (!targetWord) {
    return;
  }
  targetWord.votes += amount;
}

export function getVoteAmount(playername) {
  let player = players.find((p) => p.name === playername);
  if (!player) {
    return 0;
  }
  return player.votes;
}