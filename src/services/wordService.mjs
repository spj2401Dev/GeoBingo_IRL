import { wordlist } from '../utility/wordsList.mjs';
import { changeGameStatus } from './gameService.mjs';
import { GameStatus } from '../enums/gameStatusEnum.mjs';
import { getWordsFromPlayer, VoteForPlayer, AddVoteToWord, getVoteAmount } from './playerService.mjs';
import { game } from '../models/game.mjs';
import webSocketService from './webSocketService.mjs';

let wordsPerPlayer = 9;
let userWordList = [];

export async function setWordsService(req) {
  let words = req.body.words;
  wordsPerPlayer = req.body.wordsPerPlayer;
  let time = req.body.time;
  let votes = req.body.votesPerPlayer;
  let penalty = req.body.penalty;
  if (words.length + wordlist.length < wordsPerPlayer) {
    return { status: 400, data: { message: 'Not enough words provided' } };
  }
  if (words.length <= wordsPerPlayer) {
    const wordsNeeded = wordsPerPlayer - words.length;
    words = words.concat(await getWords(wordsNeeded, wordlist));
  }
  userWordList = words;
  game.time = time;
  game.votesPerPlayer = votes;
  game.removePoints = penalty;
  await changeGameStatus(GameStatus.STARTING);
  webSocketService.sendToAll('WORDS_UPDATED', null);
  return { status: 200, data: { message: userWordList } };
}

export async function getWords(numberOfWords = wordsPerPlayer, wordList = userWordList) {
  const randomWords = wordList.sort(() => Math.random() - 0.5);
  return randomWords.slice(0, numberOfWords);
}

export async function getWordsForPlayerService(req) {
  const playerName = req.params.player;
  const words = getWordsFromPlayer(playerName);
  if (words === null) {
    return { status: 400, data: { message: 'Player not found' } };
  }
  return { status: 200, data: { words, time: game.endTime } };
}

export function resetWordsService() {
  userWordList = [];
}

export async function voteForPlayerService(req) {
  const { word, receivingPlayer, sendingPlayer } = req.body;
  if (!word || !receivingPlayer || !sendingPlayer) {
    return { status: 400, data: { message: 'Missing parameters' } };
  }
  if (receivingPlayer === sendingPlayer) {
    return { status: 400, data: { message: 'Cannot vote for yourself' } };
  }
  const response = VoteForPlayer(sendingPlayer);
  if (!response) {
    return { status: 400, data: { message: 'Could not vote' } };
  }
  AddVoteToWord(word, receivingPlayer);
  webSocketService.sendToAll('VOTES_UPDATED', { word, receivingPlayer });
  return { status: 200, data: { message: 'Vote added' } };
}

export async function getMyVotesService(req) {
  const player = req.params.player;
  return { status: 200, data: { votes: getVoteAmount(player) } };
}

export async function getWordsForSetupService(req) {
  let amount = parseInt(req.query.amount, 10);
  if (isNaN(amount) || amount <= 0) {
    amount = wordsPerPlayer;
  }
  // Fallback to default wordlist if userWordList is empty
  const sourceList = (userWordList && userWordList.length > 0) ? userWordList : wordlist;
  const words = await getWords(amount, sourceList);
  return { status: 200, data: { words } };
}
