import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

export async function uploadImageService(imagesData) {
  try {
    const sendInstanceUrl = process.env.SEND_INSTANCE_URL || '';
    const uploadToSendInstance = process.env.UPLOAD_TO_SEND_INSTANCE === 'true';
    
    if (!uploadToSendInstance || !sendInstanceUrl) {
      console.error('Send instance upload is disabled or URL not configured');
      return { success: false, error: 'Send instance upload is disabled or not configured' };
    }
    
    const formData = new FormData();
    
    for (const item of imagesData) {
      const { player, word, photo } = item;
      
      const photoPath = path.join(projectRoot, 'data', 'photos', photo);

      const filename = `${player.replace(/\s+/g, '_')}_${word.replace(/\s+/g, '_')}.jpg`;

      if (fs.existsSync(photoPath)) {
        const fileStream = fs.createReadStream(photoPath);
        formData.append('files', fileStream, { filename });
      } else {
        console.warn(`File not found: ${photoPath}`);
      }
    }
    
    formData.append('password', "GeoBingo");
    formData.append('serviceName', 'GeoBingo');
    formData.append('apiKey', process.env.SEND_API_KEY || '');
    formData.append('duration', process.env.SEND_DURATION || '6000');
    
    const uploadUrl = `${sendInstanceUrl}/api/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Upload failed with status ${response.status}: ${errorText}`);
      return { success: false, error: `Upload failed with status ${response.status}` };
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading images:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}