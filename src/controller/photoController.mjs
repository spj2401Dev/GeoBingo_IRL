import express from 'express';
import { postPhotoService, getPhotoService, getAllPhotosService, declinePhotoService } from '../services/photoService.mjs';

const photoRouter = express.Router();

photoRouter.post('/', async (req, res) => {
  const result = await postPhotoService(req);
  res.status(result.status).json(result.data);
});

photoRouter.get('/', async (req, res) => {
  const result = await getPhotoService(req);
  res.status(result.status).json(result.data);
});

photoRouter.get('/all', async (req, res) => {
  const result = await getAllPhotosService();
  res.status(result.status).json(result.data);
});

photoRouter.post('/decline', async (req, res) => {
  const result = await declinePhotoService(req);
  res.status(result.status).json(result.data);
});

export default photoRouter;