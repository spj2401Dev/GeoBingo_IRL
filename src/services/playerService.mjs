import { game } from "../models/game.mjs";
import { getWords } from "./wordService.mjs";
import { player as PlayerModel } from "../models/player.mjs";
import { word as WordModel } from "../models/word.mjs";
import { getSendLink } from "./gameService.mjs";
import { getGameStatusService } from './gameService.mjs';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import webSocketService from './webSocketService.mjs';

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
      return { ...WordModel[index], Label: word, completed: false, photo: "", votes: 0 };
    } else {
      return { Label: word, completed: false, photo: "", votes: 0 };
    }
  });

  if (game.players.length === 0) {
    player.isAdmin = true;
  }

  game.players.push(player);
}

export function modifyPlayer(player) {
  const idx = game.players.findIndex((p) => p.name == player.name);
  if (idx !== -1) {
    game.players[idx] = player;
  }
}

export function getWordsFromPlayer(playerName) {
  const foundPlayer = game.players.find((p) => p.name === playerName);
  return foundPlayer ? foundPlayer.words : null;
}

export function CheckIfPlayerExists(player) {
  return game.players.some((p) => p.name == player.name);
}

export function AddImageToPlayer(image, player, word) {
  var targetPlayer = game.players.find(p => p.name == player);
  if (targetPlayer) {
    var targetWord = targetPlayer.words.find(w => w.Label === word);
    if (targetWord) {
      targetWord.photo = image;
      targetWord.completed = true;
    }
  }
}

export function GetPlayers() {
  if (!game.players || game.players.length === 0) {
    return null;
  }
  return game.players.map(player => ({ name: player.name, team: player.team }));
}

export function GetFullPlayers() {
  if (!game.players || game.players.length === 0) {
    return null;
  }
  return game.players;
}

export function DeclinePhoto(playername, word) {
  game.players.forEach((p) => {
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
  game.players.forEach((p) => {
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
  const sendLink = getSendLink();
  return {
    rankings: rankList,
    sendData: sendLink
  };
}

export function ResetPlayers() {
  game.players = [];
}

function PlayerHasEnoughVotes(playername) {
  let player = game.players.find((p) => p.name === playername);
  return player ? player.votes > 0 : false;
}

function removeVote(playername) {
  let player = game.players.find((p) => p.name === playername);
  if (player) {
    player.votes -= 1;
  }
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
  let player = game.players.find((p) => p.name === playername);
  if (!player) return;
  let targetWord = player.words.find((w) => w.Label === word);
  if (!targetWord) return;
  targetWord.votes += amount;
}

export function getVoteAmount(playername) {
  let player = game.players.find((p) => p.name === playername);
  return player ? player.votes : 0;
}

export function GetAllImages() {
  let allImages = [];
  game.players.forEach((p) => {
    p.words.forEach((w) => {
      if (w.photo) {
        allImages.push({
          player: p.name,
          word: w.Label,
          photo: w.photo
        });
      }
    });
  });
  return allImages;
}

export async function addPlayerService(playerName, team, votesPerPlayer) {
  // Allow joining only if game is NOT_STARTED or STARTING
  if (![GameStatus.NOT_STARTED, GameStatus.STARTING].includes(getGameStatusService())) {
    return { status: 400, data: { message: 'You cannot join the game at this time. Please wait for the game to start.' } };
  }
  let player = Object.assign({}, PlayerModel);
  var words = await getWords();
  player.name = playerName;
  if (team) player.team = team;
  if (votesPerPlayer) player.votes = votesPerPlayer;
  player.words = words.map((word, index) => {
    if (WordModel[index]) {
      return { ...WordModel[index], Label: word, completed: false, photo: "", votes: 0 };
    } else {
      return { Label: word, completed: false, photo: "", votes: 0 };
    }
  });
  if (game.players.length === 0) player.isAdmin = true;
  game.players.push(player);
  webSocketService.sendToAll('PLAYER_REFRESH', null);
  return { status: 200, data: { admin: player.isAdmin } };
}

export function getPlayersService() {
  if (!game.players || game.players.length === 0) {
    return null;
  }
  return game.players.map(player => ({ name: player.name, team: player.team }));
}
