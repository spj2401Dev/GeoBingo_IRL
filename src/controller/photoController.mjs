import express from 'express';
import { postPhotoService, getPhotoService, getAllPhotosService, declinePhotoService } from '../services/photoService.mjs';

const photoRouter = express.Router();

photoRouter.post('/:gameId', async (req, res) => {
  const result = await postPhotoService(req);
  return res.status(result.status).json(result.data);
});

photoRouter.get('/:gameId', async (req, res) => {
  const result = await getPhotoService(req);
  return res.status(result.status).json(result.data);
});

photoRouter.get('/:gameId/all', async (req, res) => {
  const result = await getAllPhotosService(req);
  return res.status(result.status).json(result.data);
});

photoRouter.post('/:gameId/decline', async (req, res) => {
  const result = await declinePhotoService(req);
  return res.status(result.status).json(result.data);
});

export default photoRouter;
