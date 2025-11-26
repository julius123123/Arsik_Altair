// Script to download face-api.js models
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const models = [
  // SSD MobileNet V1 - Better for distance detection (up to 2m)
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  // Face landmarks
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  // Face recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  // Keep Tiny for fallback/comparison
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1'
];

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

console.log('Downloading face-api.js models...\n');

let downloaded = 0;

models.forEach((model) => {
  const url = `${BASE_URL}/${model}`;
  const filePath = path.join(MODELS_DIR, model);

  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      downloaded++;
      console.log(`✓ Downloaded: ${model}`);

      if (downloaded === models.length) {
        console.log('\n✅ All models downloaded successfully!');
      }
    });
  }).on('error', (err) => {
    console.error(`✗ Error downloading ${model}:`, err.message);
  });
});
