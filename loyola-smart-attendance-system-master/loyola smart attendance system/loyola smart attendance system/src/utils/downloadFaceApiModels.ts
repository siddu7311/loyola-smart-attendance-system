/**
 * Script to download face-api.js models
 * 
 * This script should be run once to download the required models
 * from the face-api.js GitHub repository to the public/models directory.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Base URL for the models
const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights';

// Models to download
const MODELS = [
  // SSD MobileNet
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  
  // Face Landmark Model
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition Model
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to save the models
const MODELS_DIR = path.resolve(__dirname, '../../public/models');

// Create the models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`Created directory: ${MODELS_DIR}`);
}

// Download a file
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
}

// Download all models
async function downloadModels() {
  console.log('Downloading face-api.js models...');
  
  for (const model of MODELS) {
    const url = `${MODELS_URL}/${model}`;
    const dest = path.join(MODELS_DIR, model);
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`Error downloading ${model}:`, error);
    }
  }
  
  console.log('All models downloaded successfully!');
}

// Run the download
downloadModels().catch(console.error);