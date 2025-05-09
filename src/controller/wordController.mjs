import express from 'express';
import {
  setWordsService,
  getWordsForPlayerService,
  voteForPlayerService,
  getMyVotesService,
  getWordsForSetupService
} from '../services/wordService.mjs';

const wordRouter = express.Router();

wordRouter.post('/set', async (req, res) => {
  const result = await setWordsService(req);
  res.status(result.status).json(result.data);
});

wordRouter.get('/player/:player', async (req, res) => {
  const result = await getWordsForPlayerService(req);
  res.status(result.status).json(result.data);
});

wordRouter.post('/vote', async (req, res) => {
  const result = await voteForPlayerService(req);
  res.status(result.status).json(result.data);
});

wordRouter.get('/votes/:player', async (req, res) => {
  const result = await getMyVotesService(req);
  res.status(result.status).json(result.data);
});

wordRouter.get('/setup', async (req, res) => {
  const result = await getWordsForSetupService(req);
  res.status(result.status).json(result.data);
});

export default wordRouter;