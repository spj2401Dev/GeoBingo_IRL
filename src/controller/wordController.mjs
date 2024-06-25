import { wordlist } from "../utility/wordsList.mjs";
import { changeGameStatus } from "../services/gameService.mjs";
import { GameStatus } from "../enums/gameStatusEnum.mjs";
import { getWordsFromPlayer } from "../services/playerService.mjs";
import { game } from "../models/game.mjs";
import webSocketService from '../services/webSocketService.mjs';

var wordsPerPlayer = 9;
var userWordList = [];

export const setWords = async (req, res) => {
  var words = req.body.words;
  wordsPerPlayer = req.body.wordsPerPlayer;
  var time = req.body.time; // Time in Minutes

  if (words.length + wordlist.length < wordsPerPlayer) {
    return res.status(400).json({
      message: "Not enough words provided",
    });
  }

  if (words.length <= wordsPerPlayer) {
    const wordsNeeded = wordsPerPlayer - words.length;
    words = words.concat(await getWords(wordsNeeded, wordlist));
  }

  userWordList = words;
  game.time = time;

  await changeGameStatus(GameStatus.STARTING)
  webSocketService.broadcast('Words');

  return res.status(200).json({
    message: userWordList,
  });
};

export const getWords = async (numberOfWords = wordsPerPlayer, wordList = userWordList) => {
  const randomWords = wordList.sort(() => Math.random() - 0.5);
  return randomWords.slice(0, numberOfWords);
};

export const getWordsForPlayer = async (req, res) => {
  const playerName = req.params.player;
  const words = getWordsFromPlayer(playerName);

  if (words === null) {
    return res.status(400).json({
      message: "Player not found",
    });
  }

  var response = {
    words: words,
    time: game.endTime,
  };

  return res.status(200).json(response);
};

export function resetWords() {
  userWordList = [];
}