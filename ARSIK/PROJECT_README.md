# 🧠 ARSIK - Dementia Patient Assistant

A web application designed to help dementia patients recognize and remember people they interact with. The app uses real-time face detection, facial recognition, and speech recognition to automatically identify people and display their names and relationships.

## 🌟 Features

- **Real-time Face Detection**: Uses TensorFlow.js and face-api.js to detect faces in real-time
- **Face Recognition**: Matches detected faces against saved profiles
- **Speech Recognition**: Automatically captures names and relationships from conversations
- **Visual Overlay**: Displays name and relationship labels directly on the video feed
- **Local Storage**: All data stored locally in the browser for privacy
- **Manual Entry**: Option to manually add person information
- **People Management**: View, edit, and delete saved people

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **face-api.js** - Face detection and recognition
- **Web Speech API** - Speech-to-text for name extraction

### Key Libraries
- `face-api.js@0.22.2` - Browser-based face detection and recognition
- TensorFlow.js models (included)

## 📋 Prerequisites

- Node.js 18+ 
- A modern web browser (Chrome, Edge, or Firefox recommended)
- Camera access permissions
- Microphone access permissions (for speech recognition)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/julius123123/ARSIK.git
cd ARSIK
```

### 2. Install dependencies

```bash
npm install
```

### 3. Download face detection models

```bash
npm run download-models
```

This will download the required face-api.js models to `public/models/`.

### 4. Start the development server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📱 Usage

### First Time Setup

1. **Grant Permissions**: Allow camera and microphone access when prompted
2. **Start Detection**: Click "Start Detection" button
3. **Detect a Person**: Point the camera at someone
4. **Add Information**: 
   - The app will listen for phrases like "This is [name], my [relation]"
   - Or manually enter the name and relation when prompted
5. **Automatic Recognition**: Next time the person appears, their name and relation will be displayed automatically

### Supported Speech Patterns

The app recognizes these common introduction phrases:
- "This is [name], my [relation]"
- "Meet [name], my [relation]"
- "My [relation] [name]"
- "[name] is my [relation]"

Common relations: wife, husband, son, daughter, mother, father, sister, brother, friend, grandson, granddaughter, etc.

## 🗂️ Project Structure

```
ARSIK/
├── public/
│   └── models/              # Face-api.js model files
├── src/
│   ├── components/
│   │   ├── FaceRecognition.jsx    # Main detection component
│   │   ├── FaceRecognition.css
│   │   ├── PeopleList.jsx         # Saved people display
│   │   └── PeopleList.css
│   ├── utils/
│   │   ├── faceStorage.js         # LocalStorage utilities
│   │   └── speechRecognition.js   # Speech-to-text utilities
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── download-models.js       # Script to download models
├── package.json
└── README.md
```

## 🔧 Configuration

### Adjust Face Recognition Threshold

In `src/components/FaceRecognition.jsx`, modify the `minDistance` value:

```javascript
let minDistance = 0.6; // Lower = stricter matching (0.4-0.7 recommended)
```

### Change Detection Frequency

Modify the detection interval:

```javascript
detectionInterval.current = setTimeout(detectFaces, 300); // milliseconds
```

## 🔒 Privacy & Security

- **All data is stored locally** in the browser's localStorage
- No data is sent to external servers
- Face embeddings are stored as numerical vectors
- Images are stored as base64 strings in localStorage
- Clear all data anytime from the "Saved People" tab

## 🌐 Browser Compatibility

| Browser | Face Detection | Speech Recognition |
|---------|---------------|-------------------|
| Chrome  | ✅ | ✅ |
| Edge    | ✅ | ✅ |
| Firefox | ✅ | ❌ |
| Safari  | ✅ | ✅ |

**Note**: Speech recognition requires Chrome, Edge, or Safari. Firefox doesn't support Web Speech API.

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🐛 Troubleshooting

### Models not loading
- Run `npm run download-models` to re-download models
- Check that files exist in `public/models/`

### Camera not working
- Ensure camera permissions are granted
- Check if another app is using the camera
- Try using HTTPS (required by some browsers)

### Speech recognition not working
- Only works in Chrome, Edge, and Safari
- Ensure microphone permissions are granted
- Speak clearly and use common introduction phrases

### Face not being recognized
- Ensure good lighting
- Face should be clearly visible and front-facing
- Try adjusting the recognition threshold

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) by Vincent Mühler
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ for helping dementia patients stay connected
