import { getGameStatus } from "../services/gameService.mjs";

export const getGameStatus = async (req, res) => {
    return res.status(200).json({
        status: getGameStatus()
    });
};