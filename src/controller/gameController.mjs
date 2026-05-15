import express from 'express';
import {
  createGameService,
  startGame,
  confirmReview,
  getWinner,
  resetGame,
  intermissionOver,
  getGameStatusService
} from '../services/gameService.mjs';
import { getAdminToken, handleServiceError } from '../services/httpHelpers.mjs';

const gameRouter = express.Router();

function sendResult(res, result) {
  return res.status(result.status).json(result.data);
}

gameRouter.post('/', async (req, res) => {
  try {
    const game = await createGameService(req.body, `${req.protocol}://${req.get('host')}`);
    return res.status(201).json(game);
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

gameRouter.get('/:gameId/status', async (req, res) => {
  try {
    const status = await getGameStatusService(req.params.gameId);
    return res.status(200).json({ status });
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

gameRouter.post('/:gameId/start', async (req, res) => {
  try {
    await startGame(req.params.gameId, getAdminToken(req));
    return res.status(200).json({ message: 'Game started' });
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

gameRouter.post('/:gameId/confirmReview', async (req, res) => {
  try {
    await confirmReview(req.params.gameId, getAdminToken(req));
    return res.status(200).json({ message: 'Game ended' });
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

gameRouter.get('/:gameId/winner', async (req, res) => {
  try {
    return res.status(200).json(getWinner(req.params.gameId));
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

gameRouter.post('/:gameId/reset', async (req, res) => {
  try {
    await resetGame(req.params.gameId, getAdminToken(req));
    return res.status(200).json({ message: 'Game reset' });
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

gameRouter.post('/:gameId/intermissionOver', async (req, res) => {
  try {
    await intermissionOver(req.params.gameId, getAdminToken(req));
    return res.status(200).json({ message: 'Intermission over' });
  } catch (error) {
    return sendResult(res, handleServiceError(error));
  }
});

export default gameRouter;
