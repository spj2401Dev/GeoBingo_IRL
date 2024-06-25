import {
  CheckIfPlayerExists,
  AddImageToPlayer,
  GetFullPlayers,
  DeclinePhoto,
} from "../services/playerService.mjs";
import path from "path";
import webSocketService from "../services/webSocketService.mjs";
import fs from 'fs';

const uploadDir = "data/photos/";

export const PostPhoto = async (req, res) => {
  try {
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
      console.info("Created " + uploadDir + " folder!")
    }

    const word = req.body.word;

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).send("No files were uploaded.");
      return;
    }

    let uploadedFile = req.files.file;
    let sanitizedWord = word.replace(/[^a-zA-Z0-9-_]/g, "_");
    let filename = sanitizedWord + Date.now() + ".jpg";

    const savePath = path.join(uploadDir, filename);

    uploadedFile.mv(savePath, (err) => {
      if (err) {
        console.log(err);
      }
    });

    const playername = req.body.playername;
    AddImageToPlayer(filename, playername, word);

    res.send({ message: "File uploaded!", filename: filename });
  } catch (err) {
    res.status(500).send("Error uploading file.");
  }
};

export const GetPhoto = async (req, res) => {
  const playername = req.body.playername;
  const word = req.body.word;

  if (!CheckIfPlayerExists(playername)) {
    return res.status(400).json({
      message: "Player does not exist",
    });
  }

  let photo = "";

  players.forEach((p) => {
    if (p.name == playername) {
      p.words.forEach((w) => {
        if (w.label == word) {
          photo = w.photo;
        }
      });
    }
  });

  return res.status(200).json({
    photo: photo,
  });
};


export const GetAllPhotos = async (req, res) => {
  const players = GetFullPlayers();

  if (players == null) {
    return res.status(204).json("No players found");
  }

  let response = [];

  players.forEach((player) => {
    let playerResponse = {
      player: player.name,
      words: [],
    };

    player.words.forEach((word) => {
      if (word.photo) {
        playerResponse.words.push({
          word: word.Label,
          photo: word.photo,
        });
      }
    });

    response.push(playerResponse);
  });

  return res.status(200).json(response);
};

export const DeclinePhotoController = async (req, res) => {
  const playername = req.body.playername;
  const word = req.body.word;
  DeclinePhoto(playername, word);

  webSocketService.broadcast("Decline");

  res.status(200).send("Photo declined.");
}