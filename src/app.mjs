import express from "express";
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { PostPhoto, GetAllPhotos, DeclinePhotoController } from "./controller/photoController.mjs";
import { setWords, getWordsForPlayer } from "./controller/wordController.mjs";
import { getGameStatus, startGameController, getWinnerController, ConfirmReview } from "./controller/gameController.mjs";
import { GetPlayersApi, PostPlayer } from "./controller/playerController.mjs";
import { GameStatus } from './enums/gameStatusEnum.mjs';
import { getGameStatusService } from './services/gameService.mjs';
import config from '../config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(fileUpload());
app.use(express.json());

app.get("/getGameStatus", getGameStatus);
app.post("/startGame", startGameController);
app.get("/getWinner", getWinnerController);
app.get("/confirmReview", ConfirmReview);

app.post("/words", setWords);

app.post("/photo", await PostPhoto);
app.get("/allPhotos", GetAllPhotos);
app.post("/declinePhoto", DeclinePhotoController)

app.get("/getPlayers", GetPlayersApi)
app.post("/addPlayer", PostPlayer);
app.get("/getWordsForPlayer/:player", getWordsForPlayer);

app.get("/", async (req, res) => {
  var gameStatus = await getGameStatusService();
  console.log(gameStatus);
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

app.listen(config.Api.Port, config.Api.Ip, () => {
  console.log("Api running on http://" + config.Api.Ip + ":" + config.Api.Port);
});