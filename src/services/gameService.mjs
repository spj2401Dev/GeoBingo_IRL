import { game } from "../models/game.mjs";
import { wordlist } from "../utility/wordsList.mjs";
import { ResetPlayers, GetAllImages } from "./playerService.mjs";
import { resetWords } from "../controller/wordController.mjs"
import { GameStatus } from "../enums/gameStatusEnum.mjs";
import { uploadImageService } from "./uploadImagesService.mjs";
import dotenv from 'dotenv';

dotenv.config();

const gameName = generateGameName();
var gameStatus = game.status;
var sendResponse = null;

export async function changeGameStatus(status) {
    gameStatus = status;

    if (status == GameStatus.INTERMISSION) {
        if (process.env.UPLOAD_TO_SEND_INSTANCE == "true") {
            sendResponse = "UPLOADING";
            return sendResponse = await uploadImageService(GetAllImages());
        }
    }
}

export function getSendLink() {
    if (sendResponse == "UPLOADING") {
        return { success: false, error: "Uploading images..." };
    } else if (sendResponse) {
        const sendURL = process.env.SEND_INSTANCE_URL || '';
        const uploadId = sendResponse.uploadId || '';
        const downloadLink = `${sendURL}/download/${uploadId}?p=GeoBingo`;
        sendResponse.downloadLink = downloadLink;
        return sendResponse;
    } else {
        return { success: false, error: "No upload response available." };
    }
}

export function getGameStatusService() {
    return gameStatus
}

function generateGameName() {
    const randomWords = wordlist.sort(() => Math.random() - 0.5);
    return randomWords.slice(0, 3).join(" ");
}

export function getGameName() {
    return gameName;
}

export function resetGame() {
    ResetPlayers();
    resetWords();
    changeGameStatus(GameStatus.NOT_STARTED);
}