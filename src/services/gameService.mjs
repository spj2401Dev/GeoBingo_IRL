import path from 'path';
import { fileURLToPath } from 'url';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { GameMode } from '../enums/gameModeEnum.mjs';
import { createGame, requireGame, serializeGame } from './gameStore.mjs';
import { getGameModeAdapter } from './gamemodeService.mjs';
import { setGameWordsFromPayload } from './wordService.mjs';
import { deleteImagesForGameService } from './deleteImagesService.mjs';
import webSocketService from './webSocketService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

export async function createGameService(payload, baseUrl) {
  const game = createGame();
  await setGameWordsFromPayload(game, payload, { requireNotRunning: false });
  const joinPath = `/g/${encodeURIComponent(game.id)}`;

  return {
    game: serializeGame(game),
    gameId: game.id,
    adminToken: game.adminToken,
    joinUrl: baseUrl ? new URL(joinPath, baseUrl).toString() : joinPath
  };
}

export function getGameStatusService(gameId) {
  return requireGame(gameId).status;
}

export function getGameInfoService(gameId) {
  return serializeGame(requireGame(gameId));
}

export function assertAdmin(game, token) {
  if (!game.isAdmin(token)) {
    const error = new Error('Only the game creator can do this');
    error.status = 403;
    throw error;
  }
}

export async function startGame(gameId, adminToken) {
  const game = requireGame(gameId);
  assertAdmin(game, adminToken);
  const gameModeAdapter = getGameModeAdapter(game);

  if (game.status !== GameStatus.STARTING) {
    const error = new Error('Game can only be started from the lobby');
    error.status = 400;
    throw error;
  }

  if (game.players.length === 0) {
    const error = new Error('At least one player must join before starting');
    error.status = 400;
    throw error;
  }

  const time = Number.parseInt(game.time, 10);
  if (!Number.isFinite(time) || time <= 0) {
    const error = new Error('Game duration is invalid');
    error.status = 400;
    throw error;
  }

  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + time);
  game.endTime = endTime;
  if (gameModeAdapter.onGameStarted) {
    gameModeAdapter.onGameStarted(game);
  }
  changeGameStatus(game, GameStatus.RUNNING);
  webSocketService.sendToGame(game.id, 'GAME_STARTED', null);

  const durationUntilEnd = Math.max(endTime.getTime() - Date.now(), 0);
  game.clearTimer();
  game.timer = setTimeout(() => {
    webSocketService.sendToGame(game.id, 'GAME_ENDED', null);
    changeGameStatus(game, GameStatus.INTERMISSION);
  }, durationUntilEnd);
}

export async function confirmReview(gameId, adminToken) {
  const game = requireGame(gameId);
  assertAdmin(game, adminToken);

  if (game.status !== GameStatus.REVIEW) {
    const error = new Error('Game is not in review');
    error.status = 400;
    throw error;
  }

  changeGameStatus(game, GameStatus.ENDED);
  webSocketService.sendToGame(game.id, 'GAME_WIN', null);
}

export function getWinner(gameId) {
  const game = requireGame(gameId);
  const gameModeAdapter = getGameModeAdapter(game);

  if (gameModeAdapter.buildRankings) {
    return { rankings: gameModeAdapter.buildRankings(game) };
  }

  const groups = new Map();

  for (const player of game.players) {
    const isTeam = Boolean(player.teamName);
    const key = isTeam ? `team:${player.teamName.toLowerCase()}` : `player:${player.id}`;
    const displayName = isTeam ? player.teamName : player.name;

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name: displayName,
        isTeam,
        members: [],
        completedPhotos: 0,
        votesScore: 0,
        penaltyPoints: 0,
        totalScore: 0
      });
    }

    const group = groups.get(key);
    const completedPhotos = gameModeAdapter.getCompletedPhotosForPlayer(player, game);
    const votesScore = player.words.reduce((acc, word) => acc + word.votes, 0);

    group.members.push(player.name);
    group.completedPhotos += completedPhotos;
    group.votesScore += votesScore;
    group.penaltyPoints += player.penaltyPoints || 0;
  }

  const rankings = Array.from(groups.values()).map((group) => ({
    ...group,
    totalScore: group.completedPhotos + group.votesScore - group.penaltyPoints
  }));

  rankings.sort((a, b) => b.totalScore - a.totalScore);
  return { rankings };
}

export async function resetGame(gameId, adminToken) {
  const game = requireGame(gameId);
  assertAdmin(game, adminToken);
  const gameModeAdapter = getGameModeAdapter(game);
  if (gameModeAdapter.clearModeState) {
    gameModeAdapter.clearModeState(game);
  }
  game.clearTimer();
  game.players = [];
  game.words = [];
  game.time = 0;
  game.endTime = null;
  game.wordsPerPlayer = 9;
  game.votesPerPlayer = 0;
  game.removePoints = false;
  game.allowSkip = false;
  game.gameMode = GameMode.INDIVIDUAL;
  game.modeState = {};
  changeGameStatus(game, GameStatus.NOT_STARTED);
  await deleteImagesForGameService(game.id, projectRoot);
  webSocketService.sendToGame(game.id, 'GAME_RESET', null);
}

export async function intermissionOver(gameId, adminToken) {
  const game = requireGame(gameId);
  assertAdmin(game, adminToken);

  if (game.status !== GameStatus.INTERMISSION) {
    const error = new Error('Game is not in intermission');
    error.status = 400;
    throw error;
  }

  changeGameStatus(game, GameStatus.REVIEW);
  webSocketService.sendToGame(game.id, 'GAME_RELOAD', null);
}

export function changeGameStatus(game, status) {
  game.status = status;
}
