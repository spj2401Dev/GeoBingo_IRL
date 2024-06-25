import { game } from "../models/game.mjs";
import { wordlist } from "../utility/wordsList.mjs";
import { ResetPlayers } from "./playerService.mjs";
import { resetWords } from "../controller/wordController.mjs"
import { GameStatus } from "../enums/gameStatusEnum.mjs";

const gameName = generateGameName();
var gameStatus = game.status;

export function changeGameStatus(status) {
    gameStatus = status;
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