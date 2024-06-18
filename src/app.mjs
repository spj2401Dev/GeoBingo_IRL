import express from 'express';
import { PostPhoto } from './controller/PhotoController.mjs';
import { setWords } from './controller/wordController.mjs';
import { getGameStatus } from './controller/gameController.mjs';

const app = express();
app.use(express.json());

app.get("/getGameStatus", getGameStatus);

app.post("/words", setWords);

app.post('/photo', PostPhoto);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});