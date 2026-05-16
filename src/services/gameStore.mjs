import { Game } from '../models/game.mjs';

const games = new Map();

export function createGame() {
    let game = new Game();
    while (games.has(game.id)) {
        game = new Game();
    }
    games.set(game.id, game);
    return game;
}

export function getGame(gameId) {
    return games.get(gameId);
}

export function requireGame(gameId) {
    const game = getGame(gameId);
    if (!game) {
        const error = new Error('Game not found');
        error.status = 404;
        throw error;
    }
    return game;
}

export function serializeGame(game) {
    return {
        id: game.id,
        status: game.status,
        time: game.time,
        endTime: game.endTime,
        wordsPerPlayer: game.wordsPerPlayer,
        votesPerPlayer: game.votesPerPlayer,
        removePoints: game.removePoints,
        allowSkip: game.allowSkip,
        gameMode: game.gameMode,
        playerCount: game.players.length
    };
}
