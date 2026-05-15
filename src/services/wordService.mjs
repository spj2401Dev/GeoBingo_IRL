import { wordlist } from '../utility/wordsList.mjs';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { BingoWord } from '../models/word.mjs';
import { requireGame, serializeGame } from './gameStore.mjs';
import { getAdminToken, getPlayerId, getPlayerToken, fail, ok } from './httpHelpers.mjs';
import webSocketService from './webSocketService.mjs';

let defaultWordsPerPlayer = 9;

function parsePositiveInt(value, fallback, { min = 1, max = 1000 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function normalizeWord(value) {
  return String(value || '').trim().slice(0, 80);
}

function sanitizeWordList(words) {
  if (!Array.isArray(words)) {
    return [];
  }
  return words.map(normalizeWord).filter(Boolean);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function setGameWordsFromPayload(game, payload, { requireNotRunning = true } = {}) {
  if (requireNotRunning && ![GameStatus.NOT_STARTED, GameStatus.STARTING].includes(game.status)) {
    const error = new Error('Words can only be changed before the game starts');
    error.status = 400;
    throw error;
  }

  const providedWords = sanitizeWordList(payload?.words);
  const wordsPerPlayer = parsePositiveInt(payload?.wordsPerPlayer, defaultWordsPerPlayer, { min: 1, max: 99 });
  const time = parsePositiveInt(payload?.time, wordsPerPlayer * 5, { min: 1, max: 1000 });
  const votesPerPlayer = parsePositiveInt(payload?.votesPerPlayer, 0, { min: 0, max: 1000 });
  const removePoints = Boolean(payload?.penalty);

  if (providedWords.length + wordlist.length < wordsPerPlayer) {
    const error = new Error('Not enough words provided');
    error.status = 400;
    throw error;
  }

  const wordsNeeded = Math.max(wordsPerPlayer - providedWords.length, 0);
  const finalWords = providedWords.concat(getWords(wordsNeeded, wordlist));

  game.words = finalWords;
  game.wordsPerPlayer = wordsPerPlayer;
  game.time = time;
  game.votesPerPlayer = votesPerPlayer;
  game.removePoints = removePoints;
  game.status = GameStatus.STARTING;
  defaultWordsPerPlayer = wordsPerPlayer;
}

export async function setWordsService(req) {
  try {
    const game = requireGame(req.params.gameId);
    if (!game.isAdmin(getAdminToken(req))) {
      return fail(403, 'Only the game creator can do this');
    }
    await setGameWordsFromPayload(game, req.body);
    webSocketService.sendToGame(game.id, 'WORDS_UPDATED', null);
    return ok({ message: game.words, game: serializeGame(game) });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export function getWords(numberOfWords = defaultWordsPerPlayer, sourceList = wordlist) {
  return shuffle(sourceList).slice(0, numberOfWords);
}

function serializeWord(word) {
  return {
    id: word.id,
    label: word.label,
    completed: word.completed,
    photo: word.photo,
    photoPath: word.photoPath,
    votes: word.votes
  };
}

export async function getWordsForPlayerService(req) {
  try {
    const game = requireGame(req.params.gameId);
    const player = game.players.find((item) => item.id === req.params.playerId);
    const token = getPlayerToken(req);

    if (!player) {
      return fail(404, 'Player not found');
    }

    if (player.token !== token && !game.isAdmin(getAdminToken(req))) {
      return fail(403, 'You can only view your own prompts');
    }

    return ok({ words: player.words.map(serializeWord), time: game.endTime });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export function buildWordsForPlayer(game) {
  return getWords(game.wordsPerPlayer, game.words).map((label) => new BingoWord(label));
}

function findPlayer(game, playerId) {
  return game.players.find((player) => player.id === playerId);
}

function findPlayerByToken(game, playerId, token) {
  const player = findPlayer(game, playerId);
  if (!player || player.token !== token) {
    return null;
  }
  return player;
}

export async function voteForPlayerService(req) {
  try {
    const game = requireGame(req.params.gameId);

    if (game.status !== GameStatus.REVIEW) {
      return fail(400, 'Voting is only allowed during review');
    }

    const sender = findPlayerByToken(game, getPlayerId(req), getPlayerToken(req));
    if (!sender) {
      return fail(403, 'Invalid player token');
    }

    const receivingPlayer = findPlayer(game, req.body?.receivingPlayerId);
    if (!receivingPlayer) {
      return fail(404, 'Receiving player not found');
    }

    const targetWord = receivingPlayer.words.find((word) => word.id === req.body?.wordId);
    if (!targetWord || !targetWord.completed) {
      return fail(404, 'Photo not found');
    }

    const samePlayer = receivingPlayer.id === sender.id;
    const sameTeam = sender.teamName && receivingPlayer.teamName && sender.teamName === receivingPlayer.teamName;
    if (samePlayer || sameTeam) {
      return fail(400, 'Cannot vote for yourself or your own team');
    }

    if (sender.votes <= 0) {
      return fail(400, 'No votes left');
    }

    sender.votes -= 1;
    targetWord.votes += 1;
    webSocketService.sendToGame(game.id, 'VOTES_UPDATED', {
      wordId: targetWord.id,
      receivingPlayerId: receivingPlayer.id
    });

    return ok({ message: 'Vote added', votesLeft: sender.votes });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export async function getMyVotesService(req) {
  try {
    const game = requireGame(req.params.gameId);
    const player = findPlayer(game, req.params.playerId);

    if (!player) {
      return fail(404, 'Player not found');
    }

    if (player.token !== getPlayerToken(req) && !game.isAdmin(getAdminToken(req))) {
      return fail(403, 'You can only view your own votes');
    }

    return ok({ votes: player.votes });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export async function getWordsForSetupService(req) {
  try {
    const amount = parsePositiveInt(req.query.amount, defaultWordsPerPlayer, { min: 1, max: 99 });
    const sourceList = req.params.gameId ? requireGame(req.params.gameId).words : wordlist;
    const words = getWords(amount, sourceList.length > 0 ? sourceList : wordlist);
    return ok({ words });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}
