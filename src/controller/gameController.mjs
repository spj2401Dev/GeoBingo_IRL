import express from 'express';
import { 
  startGame, 
  confirmReview, 
  getWinner, 
  resetGame, 
  intermissionOver, 
  getGameStatusService 
} from '../services/gameService.mjs';

const gameRouter = express.Router();

gameRouter.get('/status', async (req, res) => {
  const status = await getGameStatusService();
  return res.status(200).json({ status });
});

gameRouter.post('/start', async (req, res) => {
  try {
    await startGame();
    return res.status(200).json({ message: 'Game started' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

gameRouter.post('/confirmReview', async (req, res) => {
  await confirmReview();
  return res.status(200).json({ message: 'Game ended' });
});

gameRouter.get('/winner', async (req, res) => {
  const response = getWinner();
  res.status(200).json(response);
});

gameRouter.post('/reset', async (req, res) => {
  await resetGame();
  return res.status(200).json({ message: 'Game reset' });
});

gameRouter.post('/intermissionOver', async (req, res) => {
  try {
    await intermissionOver();
    return res.status(200).json({ message: 'Intermission over' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default gameRouter;