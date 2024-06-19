import express from 'express';
import { PostPhoto } from './controller/PhotoController.mjs';
import { setWords } from './controller/wordController.mjs';
import { getGameStatus } from './controller/gameController.mjs';
import { PostPlayer } from './controller/playerController.mjs';

const app = express();
app.use(express.json());

app.get("/getGameStatus", getGameStatus);

app.post("/words", setWords);

app.post('/photo', PostPhoto);

app.post("/addPlayer", PostPlayer);

app.use(express.static('client'));

app.listen(3000,"192.168.178.123", () => {
    console.log('Server is running on port 3000');
});