import express from "express";
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { PostPhoto, GetAllPhotos, DeclinePhotoController } from "./controller/photoController.mjs";
import { setWords, getWordsForPlayer, voteForPlayer, getMyVotes, getWordsForSetup } from "./controller/wordController.mjs";
import { getGameStatus, startGameController, getWinnerController, ConfirmReview, resetGameController, intermissionOver } from "./controller/gameController.mjs";
import { GetPlayersApi, PostPlayer } from "./controller/playerController.mjs";
import { GameStatus } from './enums/gameStatusEnum.mjs';
import { getGameStatusService } from './services/gameService.mjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(fileUpload());
app.use(express.json());
dotenv.config();

app.get("/getGameStatus", getGameStatus);
app.post("/startGame", startGameController);
app.post("/intermissionOver", intermissionOver);
app.get("/getWinner", getWinnerController);
app.get("/confirmReview", ConfirmReview);
app.get("/resetGame", resetGameController);

app.get("/words", getWordsForSetup)
app.post("/words", setWords);
app.post("/vote", voteForPlayer);
app.get("/vote/:player", getMyVotes)

app.post("/photo", await PostPhoto);
app.get("/allPhotos", GetAllPhotos);
app.post("/declinePhoto", DeclinePhotoController)

app.get("/getPlayers", GetPlayersApi)
app.post("/addPlayer", PostPlayer);
app.get("/getWordsForPlayer/:player", getWordsForPlayer);

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