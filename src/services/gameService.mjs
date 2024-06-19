import { game } from "../models/game.mjs";

export function changeGameStatus(status) {
    game.status = status;
    console.log("Getting game status:", game.status);  // Debugging line
}

export function getGameStatus() {
    console.log("Getting game status:", game.status);  // Debugging line
    return game.status;
}