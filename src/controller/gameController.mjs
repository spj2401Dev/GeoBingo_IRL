import { changeGameStatus } from '../services/gameService.mjs';
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
        console.log('Game ended');
        changeGameStatus(GameStatus.REVIEW);
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