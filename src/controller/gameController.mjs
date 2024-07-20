import { changeGameStatus, resetGame } from '../services/gameService.mjs';
import { GameStatus } from "../enums/gameStatusEnum.mjs";
import webSocketService from '../services/webSocketService.mjs';
import { game } from '../models/game.mjs';
import { GetWinner } from '../services/playerService.mjs';

export const getGameStatus = async (req, res) => {
    return res.status(200).json({
        status: getGameStatus()
    });
};

export const startGameController = async (req, res) => {
    var time = parseInt(game.time, 10);
    var endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + time);
    game.endTime = endTime;
    
    changeGameStatus(GameStatus.RUNNING);

    webSocketService.broadcast('Start');

    let durationUntilEnd = endTime.getTime() - Date.now();

    setTimeout(() => {
        webSocketService.broadcast('End');
        changeGameStatus(GameStatus.INTERMISSION);
    }, durationUntilEnd);

    return res.status(200).json({
        message: 'Game started'
    });
}

export const ConfirmReview = async (req, res) => {
    changeGameStatus(GameStatus.ENDED);

    webSocketService.broadcast('Win');

    return res.status(200).json({
        message: 'Game ended'
    });
}

export const getWinnerController = async (req, res) => {
    var response = GetWinner();

    res.status(200).json(response);
}

export const resetGameController = async (req, res) => { // Should probably secure this api endpoint somehow. 
    resetGame();
    return res.status(200).json({
        message: 'Game reset'
    });
}

export const intermissionOver = async (req, res) => {
    if (game.status == GameStatus.INTERMISSION) {
        return res.status(400).json({
            message: 'Game is not in intermission'
        });
    }

    webSocketService.broadcast('Reload');
    changeGameStatus(GameStatus.REVIEW);
    return res.status(200);
};