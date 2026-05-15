import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import gameRouter from './controller/gameController.mjs';
import playerRouter from './controller/playerController.mjs';
import photoRouter from './controller/photoController.mjs';
import wordRouter from './controller/wordController.mjs';
import { getGame } from './services/gameStore.mjs';
import { GameStatus } from './enums/gameStatusEnum.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();

app.use(fileUpload({
  limits: { fileSize: 8 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true
}));
app.use(express.json({ limit: '128kb' }));

app.use('/game', gameRouter);
app.use('/player', playerRouter);
app.use('/photo', photoRouter);
app.use('/word', wordRouter);

app.get(['/', '/g/:gameId'], async (req, res) => {
  const game = req.params.gameId ? getGame(req.params.gameId) : null;
  const gameStatus = game?.status || GameStatus.NOT_STARTED;

  if (req.params.gameId && !game) {
    return res.status(404).send('Game not found');
  }

  switch (gameStatus) {
    case GameStatus.NOT_STARTED:
      return res.sendFile(path.join(projectRoot, 'client/pages/setWords/index.html'));
    case GameStatus.STARTING:
      return res.sendFile(path.join(projectRoot, 'client/pages/joinGame/index.html'));
    case GameStatus.RUNNING:
      return res.sendFile(path.join(projectRoot, 'client/pages/camara/index.html'));
    case GameStatus.INTERMISSION:
      return res.sendFile(path.join(projectRoot, 'client/pages/gameEnded/index.html'));
    case GameStatus.REVIEW:
      return res.sendFile(path.join(projectRoot, 'client/pages/confirmPhotos/index.html'));
    case GameStatus.ENDED:
      return res.sendFile(path.join(projectRoot, 'client/pages/winner/index.html'));
    default:
      return res.status(404).send('Not found');
  }
});

app.use('/photos', express.static(path.join(projectRoot, 'data/photos')));
app.use(express.static(path.join(projectRoot, 'client')));

const apiPort = process.env.API_PORT || 8000;

app.listen(apiPort, () => {
  console.log(`Api running on port ${apiPort}`);
});
