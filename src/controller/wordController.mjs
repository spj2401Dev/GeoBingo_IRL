import { wordlist } from "../utility/wordsList.mjs";
import { changeGameStatus } from "../services/gameService.mjs";
import { GameStatus } from "../enums/gameStatusEnum.mjs";
import { getWordsFromPlayer } from "../services/playerService.mjs";
import { word } from "../models/word.mjs";

var wordsPerPlayer = 9;
var userWordList = [];

export const setWords = async (req, res) => {
  var words = req.body.words;
  wordsPerPlayer = req.body.wordsPerPlayer;

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

  await changeGameStatus(GameStatus.WAITING_FOR_PLAYERS)

  return res.status(200).json({
    message: userWordList,
  });
};

export const getWords = async (numberOfWords = wordsPerPlayer, wordList = userWordList) => {
  const randomWords = wordList.sort(() => Math.random() - 0.5);
  return randomWords.slice(0, numberOfWords);
};

export const getWordsForPlayer = async (req, res) => {
  const player = req.params.player;

  const words = Array.isArray(await getWordsFromPlayer(player)) ? await getWordsFromPlayer(player) : [await getWordsFromPlayer(player)];
console.log(words);


  if (words == null) {
    return res.status(400).json({
      message: "Player not found",
    });
  }

  // return as word model, with label, completed and the photo
  return res.status(200).json({
    message: words,
  });
};
