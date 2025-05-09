import path from 'path';
import fs from 'fs';
import { AddImageToPlayer, GetFullPlayers, DeclinePhoto, AddVoteToWord, CheckIfPlayerExists } from './playerService.mjs';
import { game } from '../models/game.mjs';
import webSocketService from './webSocketService.mjs';

const uploadDir = 'data/photos/';

export async function postPhotoService(req) {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const word = req.body.word;
    if (!req.files || Object.keys(req.files).length === 0) {
      return { status: 400, data: { message: 'No files were uploaded.' } };
    }
    let uploadedFile = req.files.file;
    let sanitizedWord = word.replace(/[^a-zA-Z0-9-_]/g, '_');
    let filename = sanitizedWord + Date.now() + '.jpg';
    const savePath = path.join(uploadDir, filename);
    await uploadedFile.mv(savePath, (err) => {
      if (err) {
        throw err;
      }
    });
    const playername = req.body.playername;
    AddImageToPlayer(filename, playername, word);
    return { status: 200, data: { message: 'File uploaded!', filename } };
  } catch (err) {
    return { status: 500, data: { message: 'Error uploading file.' } };
  }
}

export async function getPhotoService(req) {
  const playername = req.body.playername;
  const word = req.body.word;
  if (!CheckIfPlayerExists(playername)) {
    return { status: 400, data: { message: 'Player does not exist' } };
  }
  let photo = '';
  const players = GetFullPlayers();
  players.forEach((p) => {
    if (p.name == playername) {
      p.words.forEach((w) => {
        if (w.label == word) {
          photo = w.photo;
        }
      });
    }
  });
  return { status: 200, data: { photo } };
}

export async function getAllPhotosService() {
  const players = GetFullPlayers();
  if (!players) {
    return { status: 204, data: { message: 'No players found' } };
  }
  let response = [];
  players.forEach((player) => {
    let playerResponse = { player: player.name, words: [] };
    player.words.forEach((word) => {
      if (word.photo) {
        playerResponse.words.push({ word: word.Label, photo: word.photo, votes: word.votes });
      }
    });
    response.push(playerResponse);
  });
  return { status: 200, data: response };
}

export async function declinePhotoService(req) {
  const playername = req.body.playername;
  const word = req.body.word;
  DeclinePhoto(playername, word);
  if (game.removePoints) {
    AddVoteToWord(word, playername, -1);
  }
  webSocketService.sendToAll('PHOTO_DECLINED', { playername, word });
  return { status: 200, data: { message: 'Photo declined.' } };
}
