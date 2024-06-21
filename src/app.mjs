import express from "express";
import fileUpload from 'express-fileupload';
import { PostPhoto } from "./controller/PhotoController.mjs";
import { setWords, getWordsForPlayer } from "./controller/wordController.mjs";
import { getGameStatus } from "./controller/gameController.mjs";
import { PostPlayer } from "./controller/playerController.mjs";

const app = express();
app.use(fileUpload());
app.use(express.json());

app.get("/getGameStatus", getGameStatus);

app.post("/words", setWords);

app.post("/photo", await PostPhoto);

app.post("/addPlayer", PostPlayer);
app.get("/getWordsForPlayer/:player", getWordsForPlayer);

app.use(express.static("client"));

app.listen(3000, "192.168.178.123", () => {
  console.log("Server is running on port 3000");
});
