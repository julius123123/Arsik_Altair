# Face Detection Models

This directory contains face-api.js models downloaded from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Current Model: SSD MobileNet V1

**Changed from TinyFaceDetector to SSD MobileNet V1 for better long-distance detection**

### Detection Range Comparison:
- **TinyFaceDetector**: 0.3m - 0.5m (fast but limited range)
- **SSD MobileNet V1**: 0.5m - 2m (better accuracy and range) ✅ CURRENT

### Models in this directory:

**Face Detection:**
- ssd_mobilenetv1_model-weights_manifest.json
- ssd_mobilenetv1_model-shard1
- ssd_mobilenetv1_model-shard2

**Face Landmarks:**
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1

**Face Recognition:**
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

**Fallback (kept for reference):**
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1

Run `node download-models.js` from project root to download/update models.
