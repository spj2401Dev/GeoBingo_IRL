import { GameStatus } from "../enums/gameStatusEnum.mjs";
import { player } from "./player.mjs";

export const game = {
    status: GameStatus.NOT_STARTED,
    players : [player],
    time: 0,
    words : [],
};