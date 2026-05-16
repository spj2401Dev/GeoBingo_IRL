import express from 'express';
import {
  setWordsService,
  getWordsForPlayerService,
  voteForPlayerService,
  getMyVotesService,
  getWordsForSetupService,
  chooseBountyPromptService,
  skipBountyService
} from '../services/wordService.mjs';

const wordRouter = express.Router();

wordRouter.post('/:gameId/set', async (req, res) => {
  const result = await setWordsService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.get('/:gameId/player/:playerId', async (req, res) => {
  const result = await getWordsForPlayerService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.post('/:gameId/vote', async (req, res) => {
  const result = await voteForPlayerService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.post('/:gameId/bounty/select', async (req, res) => {
  const result = await chooseBountyPromptService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.post('/:gameId/bounty/skip', async (req, res) => {
  const result = await skipBountyService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.get('/:gameId/votes/:playerId', async (req, res) => {
  const result = await getMyVotesService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.get('/setup', async (req, res) => {
  const result = await getWordsForSetupService(req);
  return res.status(result.status).json(result.data);
});

wordRouter.get('/:gameId/setup', async (req, res) => {
  const result = await getWordsForSetupService(req);
  return res.status(result.status).json(result.data);
});

export default wordRouter;
