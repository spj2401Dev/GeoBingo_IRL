import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

export async function deleteImagesService() {
    const photosDir = path.join(projectRoot, 'data', 'photos');
    const files = fs.readdirSync(photosDir);

    files.forEach((file) => {
        const filePath = path.join(photosDir, file);
        fs.unlinkSync(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            }
        });
    });

    return { success: true };
}
