import { game } from "../models/game.mjs";
import { wordlist } from "../utility/wordsList.mjs";

const gameName = generateGameName();

export function changeGameStatus(status) {
    game.status = status;
}

export function getGameStatus() {
    return game.status;
}

function generateGameName() {
    const randomWords = wordlist.sort(() => Math.random() - 0.5);
    return randomWords.slice(0, 3).join(" ");
}

export function getGameName() {
    return gameName;
}