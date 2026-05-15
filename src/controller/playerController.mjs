import express from 'express';
import { addPlayerService, getPlayersService } from '../services/playerService.mjs';

const playerRouter = express.Router();

playerRouter.post('/:gameId', async (req, res) => {
  const result = await addPlayerService(req);
  return res.status(result.status).json(result.data);
});

playerRouter.get('/:gameId', async (req, res) => {
  const result = getPlayersService(req);
  return res.status(result.status).json(result.data);
});

export default playerRouter;
