import { CheckIfPlayerExists, AddImageToPlayer } from "../services/playerService.mjs";

export const PostPhoto = async (req, res) => {
    const file = req.files.file;
    const playername = req.body.playername;
    const word = req.body.word;

    if (!file.mimetype.startsWith('image')) {
        return res.status(400).json({
            message: 'Please upload an image file'
        });
    }

    if (!CheckIfPlayerExists(playername)) {
        return res.status(400).json({
            message: 'Player does not exist'
        });
    }

    try {
        const fileName = `${word}_${Date.now()}.jpg`;
        const filePath = path.join(__dirname, '../data/photos', fileName);
        await file.mv(filePath);
    } catch {
        return res.status(500).json({
            message: 'Failed to upload image'
        });
    }

    AddImageToPlayer(fileName, playername, word);

    return res.status(200).json({
        message: 'Image uploaded successfully'
    });
};

export const GetPhoto = async (req, res) => {
    const playername = req.body.playername;
    const word = req.body.word;

    if (!CheckIfPlayerExists(playername)) {
        return res.status(400).json({
            message: 'Player does not exist'
        });
    }

    let photo = '';

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
        photo: photo
    });
}

export const GetPhotoFile = async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../data/photos', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            message: 'File not found'
        });
    }

    return res.sendFile(filePath);
}