import { changeGameStatus } from '../services/gameService.mjs';
import { GameStatus } from "../enums/gameStatusEnum.mjs";
import webSocketService from '../services/webSocketService.mjs';

export const getGameStatus = async (req, res) => {
    return res.status(200).json({
        status: getGameStatus()
    });
};

export const startGameController = async (req, res) => {
    changeGameStatus(GameStatus.RUNNING);
    
    webSocketService.broadcast('Start');

    return res.status(200).json({
        message: 'Game started'
    });
}