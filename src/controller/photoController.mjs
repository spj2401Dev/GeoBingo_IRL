import {
  CheckIfPlayerExists,
  AddImageToPlayer,
} from "../services/playerService.mjs";
import path from "path";
import fs from "fs";

const uploadDir = "data/photos/";

export const PostPhoto = async (req, res) => {
  try {
    const word = req.body.word;

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).send("No files were uploaded.");
      return;
    }

    let uploadedFile = req.files.file;
    let filename = word + Date.now() + ".jpg";

    const savePath = path.join(uploadDir, filename);

    uploadedFile.mv(savePath, (err) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
    });

    const playername = req.body.playername;
    AddImageToPlayer(savePath, playername, word);

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

export const GetPhotoFile = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../data/photos", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "File not found",
    });
  }

  return res.sendFile(filePath);
};
