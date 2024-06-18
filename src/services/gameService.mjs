import { game } from "../models/game.mjs";

export function changeGameStatus(status) {
    game.status = status;
}

export function getGameStatus() {
    return game.status;
}