# 🚀 Quick Start Guide

## Getting the App Running (5 minutes)

### Step 1: Install & Setup
```bash
cd ARSIK
npm install
npm run download-models
npm run dev
```

### Step 2: Open in Browser
- Navigate to: http://localhost:5173
- Allow camera and microphone permissions when prompted

### Step 3: Test the App

#### Option A: Test with Speech Recognition
1. Click "Start Detection"
2. Point camera at a person
3. Say clearly: "This is John, my son"
4. The app will save the person and show their name next time

#### Option B: Test with Manual Entry
1. Click "Start Detection"
2. Point camera at a person
3. When the popup appears, type the name and relation
4. Click "Save Person"

### Step 4: View Saved People
- Click the "👥 Saved People" tab
- See all recognized faces
- Click on a person to view details
- Delete people as needed

## 💡 Tips for Best Results

### Lighting
- Use good, even lighting
- Avoid backlighting (light behind the person)
- Natural light works best

### Camera Position
- Keep face centered in frame
- Distance: 2-4 feet from camera
- Face should be clearly visible

### Speech Recognition
- Speak clearly and at normal pace
- Use one of these patterns:
  - "This is [name], my [relation]"
  - "Meet [name], my [relation]"
  - "My [relation] [name]"

### Recognition Accuracy
- First save: Get a clear, front-facing photo
- Multiple angles: Save the same person from different angles for better recognition
- Good expressions: Neutral or smiling faces work best

## 🎯 Use Case Examples

### Example 1: Daily Caregiver
```
1. Caregiver enters the room
2. App detects face (unknown)
3. Family member says: "This is Sarah, your caregiver"
4. Next day: App automatically shows "Sarah (Caregiver)"
```

### Example 2: Family Visit
```
1. Multiple family members arrive
2. As each person appears on camera
3. Say: "This is Emma, your granddaughter"
4. Then: "This is Tom, your son"
5. App recognizes all of them on future visits
```

### Example 3: Social Gathering
```
1. Friend visits
2. Say: "This is Michael, your friend"
3. App saves and recognizes on next visit
4. Shows "Michael (Friend)" automatically
```

## ⚙️ Customization

### Adjust Recognition Sensitivity
Edit `src/components/FaceRecognition.jsx`:
```javascript
// Line ~121
let minDistance = 0.6; 

// Stricter (fewer false positives): 0.4 - 0.5
// Balanced (recommended): 0.6
// Looser (catches more matches): 0.7 - 0.8
```

### Change Detection Speed
Edit `src/components/FaceRecognition.jsx`:
```javascript
// Line ~107
setTimeout(detectFaces, 300); // milliseconds

// Faster (more CPU): 100-200ms
// Balanced: 300ms
// Slower (less CPU): 500-1000ms
```

## 🔧 Troubleshooting

### "Models are still loading"
- Wait 5-10 seconds for models to load
- Check browser console for errors
- Run `npm run download-models` again

### Camera shows black screen
- Check if camera is being used by another app
- Grant camera permissions in browser
- Refresh the page

### Speech recognition not working
- Check microphone permissions
- Use Chrome, Edge, or Safari (Firefox not supported)
- Speak louder and clearer
- Use the manual entry form instead

### Person not recognized
- Improve lighting
- Get closer to camera (2-4 feet)
- Ensure face is front-facing
- Lower the recognition threshold

### App is slow
- Close other browser tabs
- Increase detection interval (500ms instead of 300ms)
- Use a device with better CPU

## 📱 Mobile Usage

The app works on mobile browsers:
1. Open http://[your-ip]:5173 on mobile
2. Use rear camera for better quality
3. Prop up phone on a stand
4. Speech recognition works great on mobile!

## 🛡️ Privacy Note

- All data stays on your device
- Nothing sent to external servers
- Clear data anytime: "Saved People" → "Clear All"
- Close browser = session ends (data persists in localStorage)

## 🎉 You're Ready!

The app is now set up and ready to help dementia patients recognize their loved ones. Start by adding family members, then caregivers, then friends.

---

Need help? Check the full documentation in PROJECT_README.md
