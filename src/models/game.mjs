import { GameStatus } from "../enums/gameStatusEnum.mjs";

export const game = {
    status: GameStatus.NOT_STARTED,
    players: [],
    time: 0,
    endTime: new Date(),
    words: [],
};
