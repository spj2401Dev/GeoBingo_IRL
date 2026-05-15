import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { Player } from '../models/player.mjs';
import { requireGame } from './gameStore.mjs';
import { buildWordsForPlayer } from './wordService.mjs';
import { getAdminToken, fail, ok } from './httpHelpers.mjs';
import webSocketService from './webSocketService.mjs';

function normalizeName(value, fieldName) {
  const normalized = String(value || '').trim();
  if (normalized.length < 1 || normalized.length > 20) {
    const error = new Error(`${fieldName} must be between 1 and 20 characters`);
    error.status = 400;
    throw error;
  }
  return normalized;
}

function optionalTeamName(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }
  if (normalized.length > 20) {
    const error = new Error('Team name must be 20 characters or fewer');
    error.status = 400;
    throw error;
  }
  return normalized;
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    teamName: player.teamName,
    isAdmin: player.isAdmin
  };
}

export async function addPlayerService(req) {
  try {
    const game = requireGame(req.params.gameId);

    if (![GameStatus.NOT_STARTED, GameStatus.STARTING].includes(game.status)) {
      return fail(400, 'You cannot join the game at this time');
    }

    if (game.words.length === 0) {
      return fail(400, 'The game has no prompts yet');
    }

    const name = normalizeName(req.body?.username, 'Username');
    const teamName = optionalTeamName(req.body?.teamName);
    const hasDuplicateName = game.players.some((player) => player.name.toLowerCase() === name.toLowerCase());

    if (hasDuplicateName) {
      return fail(409, 'Username is already taken in this game');
    }

    const player = new Player({
      name,
      teamName,
      words: buildWordsForPlayer(game),
      votes: game.votesPerPlayer,
      isAdmin: game.isAdmin(getAdminToken(req))
    });

    game.players.push(player);
    webSocketService.sendToGame(game.id, 'PLAYER_REFRESH', null);

    return ok({
      player: publicPlayer(player),
      playerId: player.id,
      playerToken: player.token,
      admin: player.isAdmin
    });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export function getPlayersService(req) {
  try {
    const game = requireGame(req.params.gameId);
    return ok(game.players.map(publicPlayer));
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}
