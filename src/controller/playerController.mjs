import express from 'express';
import { addPlayerService, getPlayersService } from '../services/playerService.mjs';

const playerRouter = express.Router();

playerRouter.post('/', async (req, res) => {
  try {
    const { username, teamName, votes } = req.body;
    const result = await addPlayerService(username, teamName, votes);
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

playerRouter.get('/', async (req, res) => {
  const players = getPlayersService();
  if (!players) {
    return res.status(204).json({ message: 'No players found' });
  }
  res.status(200).json(players);
});

export default playerRouter;