import { game } from "../models/game.mjs";
import { getWords } from "../controller/wordController.mjs"; // Bad practice
import { player as PlayerModel } from "../models/player.mjs";
import { word as WordModel } from "../models/word.mjs";

var players = game.players;

export async function addPlayer(playerName) {
  let player = Object.assign({}, PlayerModel);
  var words = await getWords();

  player.name = playerName;

  player.words = words.map((word, index) => {
    if (WordModel[index]) {
      return { ...WordModel[index], Label: word, completed: false, photo: ""};
    } else {
      return { Label: word, completed: false, photo: ""};
    }
  });

  if (players.length === 0) {
    player.isAdmin = true;
  } 

  players.push(player);
}

export function modifyPlayer(player) {
  players.forEach((p) => {
    if (p.name == player.name) {
      p = player;
    } else {
      return;
    }
  });
}

export function getWordsFromPlayer(player) {
  players.forEach((p) => {
    if (p.name == player) {
      return p.words;
    } else {
      return null;
    }
  });
}

export function CheckIfPlayerExists(player) {
  players.forEach((p) => {
    if (p.name == player.name) {
      return true;
    }
  });

  return false;
}

export function AddImageToPlayer(image, player, word) {
  players.forEach((p) => {
    if (p.name == player.name) {
      p.words.forEach((w) => {
        if (w.label == word) {
          w.photo = image;
          w.completed = true;
        }
      });
    }
  });
}
