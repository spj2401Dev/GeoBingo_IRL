import express from 'express';
import { resetGame } from '../services/gameService.mjs';

const resetRouter = express.Router();

resetRouter.post('/reset', async (req, res) => {
  try {
    await resetGame();
    res.status(200).json({ message: 'Game reset' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default resetRouter;
