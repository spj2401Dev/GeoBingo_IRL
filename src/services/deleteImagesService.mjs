import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultProjectRoot = path.resolve(__dirname, '..', '..');

export async function deleteImagesForGameService(gameId, projectRoot = defaultProjectRoot) {
    const photosDir = path.join(projectRoot, 'data', 'photos', gameId);
    await fs.rm(photosDir, { recursive: true, force: true });
    return { success: true };
}

export async function deleteImagesService() {
    const photosDir = path.join(defaultProjectRoot, 'data', 'photos');
    await fs.rm(photosDir, { recursive: true, force: true });
    return { success: true };
}
