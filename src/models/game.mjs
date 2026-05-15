import crypto from 'crypto';
import { GameStatus } from '../enums/gameStatusEnum.mjs';

function createGameId() {
    return crypto.randomBytes(4).toString('hex');
}

export class Game {
    constructor() {
        this.id = createGameId();
        this.adminToken = crypto.randomUUID();
        this.status = GameStatus.NOT_STARTED;
        this.players = [];
        this.time = 0;
        this.endTime = null;
        this.words = [];
        this.wordsPerPlayer = 9;
        this.votesPerPlayer = 0;
        this.removePoints = false;
        this.timer = null;
    }

    isAdmin(token) {
        return Boolean(token && token === this.adminToken);
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
