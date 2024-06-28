import { getGameStatusService } from '../services/gameService.mjs';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { addPlayer, GetPlayers } from '../services/playerService.mjs';
import webSocketService from '../services/webSocketService.mjs';
import { game } from '../models/game.mjs';

export const PostPlayer = async (req, res) => {

   if (getGameStatusService == GameStatus.STARTING) {
        return res.status(400).json({
            message: 'You cannot join the game at this time. Please wait for the game to start.'
        });
    }
    
    const username = req.body.username;
    const teamName = req.body.teamName;	
    const votes = game.votesPerPlayer;

    var players = GetPlayers();
    addPlayer(username, teamName, votes);
    var isAdmin = false;
    if (players == null) {
        isAdmin = true;
    }

    webSocketService.broadcast('Player refresh')

    return res.status(200).json({
        admin: isAdmin,
    });
};

export const GetPlayersApi = async (req, res) => {
    const players = GetPlayers();

    if (players == null) {
        return res.status(204).json("No players found");
    }

    return res.status(200).json(players);
};