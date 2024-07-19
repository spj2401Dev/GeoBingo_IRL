import { GameStatus } from "../enums/gameStatusEnum.mjs";

export const game = {
    status: GameStatus.NOT_STARTED,
    players: [],
    time: 0,
    endTime: new Date(),
    words: [],
    votesPerPlayer: 0,
    removePoints: false, // If true, one point is removed from the player if one of their pictures gets deleted by an Admin
};
