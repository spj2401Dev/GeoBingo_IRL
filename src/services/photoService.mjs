import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { requireGame } from './gameStore.mjs';
import { getGameModeAdapter } from './gamemodeService.mjs';
import { getAdminToken, getPlayerId, getPlayerToken, fail, ok } from './httpHelpers.mjs';
import webSocketService from './webSocketService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const photosRoot = path.join(projectRoot, 'data', 'photos');
const imageExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

function getImageExtension(uploadedFile) {
  const extension = imageExtensions.get(uploadedFile.mimetype);
  if (extension) {
    return extension;
  }

  const data = uploadedFile.data;
  if (!Buffer.isBuffer(data) || data.length < 4) {
    return null;
  }

  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return '.jpg';
  }

  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    return '.png';
  }

  if (data.slice(0, 4).toString('ascii') === 'RIFF' && data.slice(8, 12).toString('ascii') === 'WEBP') {
    return '.webp';
  }

  return null;
}

function findPlayerByToken(game, playerId, token) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || player.token !== token) {
    return null;
  }
  return player;
}

function publicPhoto(game, player, word) {
  return {
    gameId: game.id,
    playerId: player.id,
    playerName: player.name,
    teamName: player.teamName,
    wordId: word.id,
    word: word.label,
    photo: word.photo,
    photoUrl: word.photoPath,
    photoOrder: word.photoOrder,
    votes: word.votes
  };
}

export async function postPhotoService(req) {
  try {
    const game = requireGame(req.params.gameId);

    if (game.status !== GameStatus.RUNNING) {
      return fail(400, 'Photos can only be uploaded while the game is running');
    }

    const player = findPlayerByToken(game, getPlayerId(req), getPlayerToken(req));
    if (!player) {
      return fail(403, 'Invalid player token');
    }

    if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
      return fail(400, 'No files were uploaded');
    }

    const uploadedFile = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    const extension = getImageExtension(uploadedFile);
    if (!extension) {
      return fail(400, 'Only JPEG, PNG, and WEBP images are allowed');
    }

    const targetWord = player.words.find((word) => word.id === req.body?.wordId);
    if (!targetWord) {
      return fail(404, 'Prompt not found for player');
    }

    const gameModeAdapter = getGameModeAdapter(game);
    gameModeAdapter.assertCanUploadPhoto(game, player, targetWord);

    const gamePhotoDir = path.join(photosRoot, game.id);
    await fs.mkdir(gamePhotoDir, { recursive: true });

    if (targetWord.photo) {
      await fs.rm(path.join(gamePhotoDir, targetWord.photo), { force: true });
    }

    const filename = `${crypto.randomUUID()}${extension}`;
    const savePath = path.join(gamePhotoDir, filename);
    await uploadedFile.mv(savePath);

    targetWord.photo = filename;
    targetWord.photoPath = `/photos/${encodeURIComponent(game.id)}/${encodeURIComponent(filename)}`;
    targetWord.photoOrder = Math.random();
    targetWord.completed = true;
    gameModeAdapter.onPhotoUploaded(game, player, targetWord);

    webSocketService.sendToGame(game.id, 'PHOTO_UPDATED', {
      playerId: player.id,
      wordId: targetWord.id
    });

    return ok({ message: 'File uploaded', photo: publicPhoto(game, player, targetWord) });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export async function getPhotoService(req) {
  try {
    const game = requireGame(req.params.gameId);
    const player = findPlayerByToken(game, getPlayerId(req), getPlayerToken(req));

    if (!player) {
      return fail(403, 'Invalid player token');
    }

    const word = player.words.find((item) => item.id === req.query?.wordId);
    if (!word) {
      return fail(404, 'Photo not found');
    }

    return ok({ photo: word.photoPath });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export async function getAllPhotosService(req) {
  try {
    const game = requireGame(req.params.gameId);
    const photos = [];

    for (const player of game.players) {
      for (const word of player.words) {
        if (word.completed && word.photo) {
          photos.push(publicPhoto(game, player, word));
        }
      }
    }

    photos.sort((a, b) => a.photoOrder - b.photoOrder);
    return ok(photos);
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}

export async function declinePhotoService(req) {
  try {
    const game = requireGame(req.params.gameId);

    if (!game.isAdmin(getAdminToken(req))) {
      return fail(403, 'Only the game creator can decline photos');
    }

    if (game.status !== GameStatus.REVIEW) {
      return fail(400, 'Photos can only be declined during review');
    }

    const player = game.players.find((item) => item.id === req.body?.playerId);
    if (!player) {
      return fail(404, 'Player not found');
    }

    const word = player.words.find((item) => item.id === req.body?.wordId);
    if (!word || !word.completed) {
      return fail(404, 'Photo not found');
    }

    if (word.photo) {
      await fs.rm(path.join(photosRoot, game.id, word.photo), { force: true });
    }

    word.photo = null;
    word.photoPath = null;
    word.completed = false;
    word.votes = 0;
    word.completedByPlayerId = null;

    const gameModeAdapter = getGameModeAdapter(game);
    gameModeAdapter.onPhotoDeclined(game, player, word);

    const penaltyHandled = gameModeAdapter.applyDeclinePenalty
      ? gameModeAdapter.applyDeclinePenalty(game, player, word, game.removePoints)
      : false;

    if (!penaltyHandled && game.removePoints) {
      player.penaltyPoints += 1;
    }

    webSocketService.sendToGame(game.id, 'PHOTO_DECLINED', {
      playerId: player.id,
      wordId: word.id
    });

    return ok({ message: 'Photo declined' });
  } catch (error) {
    return fail(error.status || 500, error.message);
  }
}
