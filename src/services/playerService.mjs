import {game} from "../models/game.mjs";

var players = game.players;

export function addPlayer(player) {
    if (players.length == 0) {
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