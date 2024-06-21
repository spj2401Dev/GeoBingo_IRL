import { game } from '../models/game.mjs';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { addPlayer } from '../services/playerService.mjs';
import { player } from '../models/player.mjs';

export const PostPlayer = async (req, res) => {
   if (game.status !== GameStatus.WAITING_FOR_PLAYERS) {
        return res.status(400).json({
            message: 'You cannot join the game at this time. Please wait for the game to start.'
        });
    }
    
    const username = req.body.username;
    addPlayer(username);

    return res.status(200).json({
        message: 'Player added successfully'
    });
};