import { GameStatus } from "../enums/gameStatusEnum.mjs";

export const game = {
    status: GameStatus.NOT_STARTED,
    players: [],
    time: 0,
    words: [],
};

console.log("Initial game status:", game.status);  // Debugging line
