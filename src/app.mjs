import express from "express";
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import gameRouter from './controller/gameController.mjs';
import playerRouter from './controller/playerController.mjs';
import photoRouter from './controller/photoController.mjs';
import wordRouter from './controller/wordController.mjs';
import resetRouter from './controller/resetController.mjs';
import { getGameStatusService } from './services/gameService.mjs';
import { GameStatus } from './enums/gameStatusEnum.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(fileUpload());
app.use(express.json());
dotenv.config();

app.use('/game', gameRouter);
app.use('/player', playerRouter);
app.use('/photo', photoRouter);
app.use('/word', wordRouter);
app.use('/game', resetRouter);

app.get("/", async (_, res) => {
  var gameStatus = await getGameStatusService();
  switch (gameStatus) {
    case GameStatus.NOT_STARTED:
      res.sendFile(path.join(__dirname, '../client/pages/setWords/index.html'));
      break;
    case GameStatus.STARTING:
      res.sendFile(path.join(__dirname, '../client/pages/joinGame/index.html'));
      break;
    case GameStatus.RUNNING:
      res.sendFile(path.join(__dirname, '../client/pages/camara/index.html'));
      break;
    case GameStatus.INTERMISSION:
      res.sendFile(path.join(__dirname, '../client/pages/gameEnded/index.html'));
      break;
    case GameStatus.REVIEW:
      res.sendFile(path.join(__dirname, '../client/pages/confirmPhotos/index.html'));
      break;
    case GameStatus.ENDED:
      res.sendFile(path.join(__dirname, '../client/pages/winner/index.html'));
      break;
    default:
      res.status(404).send("Not found");
      break;
  }
});

app.use(express.static("client"));
app.use(express.static("data/photos"));

const apiPort = process.env.API_PORT || 8000;

app.listen(apiPort, () => {
  console.log("Api running on port " + apiPort);
});