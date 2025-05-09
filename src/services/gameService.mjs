import { GameStatus } from "../enums/gameStatusEnum.mjs";
import { game } from "../models/game.mjs";
import webSocketService from './webSocketService.mjs';
import { GetWinner, ResetPlayers, GetAllImages } from './playerService.mjs';
import { resetWordsService as resetWords } from '../services/wordService.mjs';
import { uploadImageService } from './uploadImagesService.mjs';
import { deleteImagesService } from './deleteImagesService.mjs';
import dotenv from 'dotenv';
import { wordlist } from '../utility/wordsList.mjs';
dotenv.config();

let gameStatus = game.status;
let sendResponse = null;

export async function startGame() {
  const time = parseInt(game.time, 10);
  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + time);
  game.endTime = endTime;
  await changeGameStatus(GameStatus.RUNNING);
  webSocketService.sendToAll('GAME_STARTED', null);
  const durationUntilEnd = endTime.getTime() - Date.now();
  setTimeout(async () => {
    webSocketService.sendToAll('GAME_ENDED', null);
    await changeGameStatus(GameStatus.INTERMISSION);
  }, durationUntilEnd);
}

export async function confirmReview() {
  await changeGameStatus(GameStatus.ENDED);
  webSocketService.sendToAll('GAME_WIN', null);
}

export function getWinner() {
  return GetWinner();
}

export async function resetGame() {
  ResetPlayers();
  resetWords();
  await changeGameStatus(GameStatus.NOT_STARTED);
  if (process.env.DELETE_AFTER_GAME == "true") {
    await deleteImagesService();
  }
}

export async function intermissionOver() {
  // Only allow transition if game.status is RUNNING (i.e., intermission can only be triggered after game run)
  if (game.status !== GameStatus.INTERMISSION) {
    throw new Error('Game is not in intermission');
  }
  webSocketService.sendToAll('GAME_RELOAD', null);
  await changeGameStatus(GameStatus.REVIEW);
}

export async function changeGameStatus(status) {
  gameStatus = status;
  game.status = status;
  if (status === GameStatus.INTERMISSION) {
    if (process.env.UPLOAD_TO_SEND_INSTANCE === "true") {
      sendResponse = "UPLOADING";
      sendResponse = await uploadImageService(GetAllImages());
    }
  }
}

export function getGameStatusService() {
  return gameStatus;
}

export function getSendLink() {
  if (sendResponse === "UPLOADING") {
    console.log("[getSendLink] Status: UPLOADING");
    return { success: false, error: "Uploading images..." };
  } else if (sendResponse && sendResponse.success === true && sendResponse.uploadId) {
    const sendURL = process.env.SEND_INSTANCE_URL || '';
    const uploadId = sendResponse.uploadId;
    const downloadLink = `${sendURL}/download/${uploadId}?p=GeoBingo`;
    console.log("[getSendLink] Success:", { ...sendResponse, downloadLink });
    return { ...sendResponse, downloadLink };
  } else if (sendResponse && sendResponse.success === false) {
    console.log("[getSendLink] Upload failed:", sendResponse);
    return sendResponse;
  } else {
    console.log("[getSendLink] No upload response available.");
    return { success: false, error: "No upload response available." };
  }
}

export function getGameName() {
  return gameName;
}

function generateGameName() {
  const randomWords = wordlist.sort(() => Math.random() - 0.5);
  return randomWords.slice(0, 3).join(" ");
}

const gameName = generateGameName();
