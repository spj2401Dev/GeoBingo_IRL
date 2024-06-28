import { wordlist } from "../utility/wordsList.mjs";
import { changeGameStatus } from "../services/gameService.mjs";
import { GameStatus } from "../enums/gameStatusEnum.mjs";
import { getWordsFromPlayer, VoteForPlayer, AddVoteToWord, getVoteAmount } from "../services/playerService.mjs";
import { game } from "../models/game.mjs";
import webSocketService from '../services/webSocketService.mjs';

var wordsPerPlayer = 9;
var userWordList = [];

export const setWords = async (req, res) => {
  var words = req.body.words;
  wordsPerPlayer = req.body.wordsPerPlayer;
  var time = req.body.time; // Time in Minutes
  var votes = req.body.votesPerPlayer;

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
  game.votesPerPlayer = votes;

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

export const voteForPlayer = async (req, res) => {
  const { word, receivingPlayer, sendingPlayer } = req.body;

  if (!word || !receivingPlayer || !sendingPlayer) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  if (receivingPlayer === sendingPlayer) {
    return res.status(400).json({ message: "Cannot vote for yourself" });
  }

  const response = VoteForPlayer(sendingPlayer);

  if (!response) {
    return res.status(400).json({ message: "Could not vote" });
  }

  AddVoteToWord(word, receivingPlayer);

  return res.status(200).json({ message: "Vote added" });
}

export const getMyVotes = async (req, res) => {
  const player = req.params.player;

  res.json(getVoteAmount(player));
}

export const getWordsForSetup = async (req, res) => {
  var amount = parseInt(req.query.amount, 10);

  if (isNaN(amount) || amount <= 0) {
    amount = 9;
  }

  var words = await getWords(amount, wordlist);

  if (words.length < amount) {
    return res.status(400).json({
      message: "Not enough words in the wordlist",
    });
  }

  res.json(words);
};