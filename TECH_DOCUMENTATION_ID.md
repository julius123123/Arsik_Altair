# Dokumentasi Teknis ARSIK (Altair)

## Daftar Isi
1. [Overview](#overview)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Frontend - ARSIK Patient](#frontend---arsik-patient)
4. [Frontend - ARSIK Suster (Caregiver)](#frontend---arsik-suster-caregiver)
5. [Backend & API](#backend--api)
6. [Model AI & Face Recognition](#model-ai--face-recognition)
7. [Cara Menjalankan](#cara-menjalankan)

---

## Overview

**ARSIK (Altair)** adalah aplikasi assistive technology untuk membantu pasien demensia mengenali wajah orang-orang di sekitar mereka menggunakan teknologi pengenalan wajah (face recognition) dan AI conversational assistant.

### Teknologi Stack
- Frontend: React.js dengan Vite
- Backend: Node.js dengan Express
- Face Recognition: face-api.js atau @vladmandic/human
- AI Assistant: OpenAI GPT (conversational AI)
- Storage: LocalStorage (frontend), In-Memory Maps (backend)

---

## Arsitektur Sistem

ARSIK Patient (Pasien) <--> ARSIK Backend (API Server) <--> ARSIK Suster (Caregiver)
         |                           |
         |                           |
         v                           v
Face Detection (Browser AI)    Data Storage (In-Memory DB)

### Alur Kerja Sistem
1. Pasien membuka aplikasi ARSIK Patient dan mengaktifkan kamera
2. Sistem mendeteksi wajah menggunakan face recognition model
3. Jika wajah tidak dikenal, pasien atau pengunjung diminta memperkenalkan diri
4. Data dikirim ke backend untuk mendapat approval dari caregiver
5. Caregiver menyetujui atau menolak data baru melalui dashboard
6. Data yang disetujui disinkronisasi kembali ke aplikasi pasien
7. Pasien dapat berkomunikasi dengan AI Assistant untuk bantuan tambahan

---

## Frontend - ARSIK Patient

### Lokasi
`/ARSIK/`

### Struktur Folder
```
ARSIK/
├── src/
│   ├── App.jsx                 # Root component dengan sidebar navigation
│   ├── components/
│   │   ├── FaceRecognition.jsx  # Komponen deteksi wajah
│   │   ├── Jadwal.jsx           # Tampilan jadwal harian
│   │   ├── ConversationAssistant.jsx  # Chat AI
│   │   ├── RoutineNotification.jsx    # Notifikasi rutinitas
│   │   └── LocationTracker.jsx        # Tracking lokasi pasien
│   └── utils/
│       ├── faceStorage.js       # LocalStorage management
│       ├── apiClient.js         # HTTP client untuk backend
│       ├── conversationAI.js    # AI conversation logic
│       ├── speechRecognition.js # Voice recognition
│       └── textToSpeech.js      # Text-to-speech output
└── public/models/               # Model face recognition
```

### Fitur Utama

#### 1. Face Recognition (FaceRecognition.jsx)
- Deteksi wajah real-time menggunakan webcam
- Face matching dengan database lokal
- Manual entry jika wajah tidak dikenali
- Sidebar "Kerabat Terdaftar" menampilkan daftar orang yang sudah tersimpan
- Speech recognition untuk input suara
- TTS (Text-to-Speech) untuk announce nama orang yang terdeteksi

**Fungsi Utama:**
```javascript
- startDetection()           // Mulai deteksi wajah
- detectFaces()              // Proses deteksi per frame
- findBestMatch()            // Cocokkan wajah dengan database
- savePendingPerson()        // Simpan orang baru (pending approval)
- handleDeletePerson()       // Hapus data orang
```

#### 2. Jadwal Harian (Jadwal.jsx)
- Menampilkan jadwal rutinitas pasien hari ini
- Progress tracker (completed/total tasks)
- Status jadwal: completed, ongoing, upcoming
- Auto-refresh setiap 30 detik

#### 3. AI Assistant (ConversationAssistant.jsx)
- Chat berbasis AI untuk membantu pasien
- Konteks: profil pasien, kerabat terdaftar, jadwal harian
- Floating button merah di kanan bawah untuk akses cepat

#### 4. Routine Notification (RoutineNotification.jsx)
- Notifikasi overlay untuk jadwal yang akan datang
- TTS announcement otomatis
- Dismiss notification secara manual

#### 5. Location Tracker (LocationTracker.jsx)
- Tracking lokasi pasien menggunakan Geolocation API
- Alert jika pasien keluar dari area aman
- Kirim lokasi ke backend untuk monitoring

### State Management
- React Hooks (useState, useEffect, useRef)
- LocalStorage untuk data persisten:
  - dementia_app_faces - Data wajah yang tersimpan
  - arsik_patient_id - ID unik pasien
  - arsik_patient_profile - Profil pasien (nama, keluarga, hobi)

### API Integration (apiClient.js)
```javascript
// Face Recognition API
submitForApproval(data)       // Submit wajah baru untuk approval
getApprovedPeople()           // Ambil data yang sudah di-approve
syncApprovedPeople()          // Sinkronisasi data dari server

// Routine API
getPendingRoutines()          // Ambil jadwal yang akan datang
getPatientRoutines()          // Ambil semua jadwal pasien

// Location API
sendLocationUpdate(location)  // Kirim update lokasi
```

---

## Frontend - ARSIK Suster (Caregiver)

### Lokasi
- Desktop: `/ARSIK_suster/`
- Mobile: `/ARSIK_suster_mobile/`

### Fitur Utama

#### 1. Approval Dashboard (ApprovalDashboard.jsx)
- Review permintaan pengenalan wajah baru dari pasien
- Approve atau Reject dengan satu klik
- Preview foto dan informasi (nama, relasi)

#### 2. Face Upload (FaceUpload.jsx)
- Upload foto kerabat secara manual
- Input nama dan relasi
- Sistem akan generate face descriptor otomatis

#### 3. Routine Manager (RoutineManager.jsx)
- Buat, edit, hapus jadwal rutinitas pasien
- Set waktu, recurring schedule
- Push notification ke aplikasi pasien

#### 4. AI Configuration (AIConfiguration.jsx)
- Setup profil pasien (nama, umur, keluarga, hobi)
- Konfigurasi AI assistant behavior
- Manage conversation context

#### 5. Home Dashboard (Home.jsx)
- Overview status pasien
- Quick stats (jumlah kerabat, jadwal hari ini)
- Recent activities

#### Mobile Version
- Bottom navigation untuk navigasi cepat
- Responsive design untuk tablet dan smartphone
- Fitur sama dengan versi desktop

---

## Backend & API

### Lokasi
`/ARSIK_backend/`

### Teknologi
- Node.js dengan Express.js
- CORS enabled untuk cross-origin requests
- In-Memory Storage (Map data structures)

### Server File: `server.js`

#### Data Storage (In-Memory)
```javascript
const pendingApprovals = new Map();   // id -> { patientId, name, relation, ... }
const approvedPeople = new Map();     // id -> { patientId, name, relation, ... }
const routines = new Map();           // id -> { patientId, activityName, ... }
const patientProfiles = new Map();    // patientId -> { name, age, ... }
const locations = new Map();          // patientId -> { lat, lng, timestamp }
```

### API Endpoints

#### Face Recognition APIs
```
POST   /api/pending                    # Submit wajah baru untuk approval
GET    /api/pending/:patientId         # List pending approvals
PUT    /api/pending/:id/approve        # Approve wajah
DELETE /api/pending/:id/reject         # Reject wajah
GET    /api/approved/:patientId        # List wajah yang sudah approved
POST   /api/approved                   # Upload wajah langsung (caregiver)
```

Request Body - Submit Pending:
{
  "patientId": "patient_001",
  "name": "Budi Ahmad",
  "relation": "Anak Kandung",
  "descriptor": [0.123, -0.456, ...],
  "imageData": "data:image/jpeg;base64,..."
}

Response:
{
  "success": true,
  "id": "1638123456789",
  "message": "Submitted for approval"
}

#### Routine/Schedule APIs
```
POST   /api/routines                   # Buat jadwal baru
GET    /api/routines                   # List semua jadwal
GET    /api/routines/:patientId        # List jadwal per pasien
GET    /api/routines/:patientId/pending # Jadwal yang akan datang
PUT    /api/routines/:id               # Update jadwal
DELETE /api/routines/:id               # Hapus jadwal
```

Request Body - Create Routine:
{
  "patientId": "patient_001",
  "activityName": "Minum Obat",
  "description": "Obat tekanan darah",
  "startTime": "08:00",
  "endTime": "08:30",
  "isRecurring": true,
  "frequency": "daily"
}

#### Location APIs
```
POST   /api/location                   # Update lokasi pasien
GET    /api/location/:patientId        # Get lokasi terkini
GET    /api/location/:patientId/alerts # Get location alerts
```

#### Patient Profile APIs
```
POST   /api/patient/profile            # Set/Update profil pasien
GET    /api/patient/profile/:patientId # Get profil pasien
```

### CORS Configuration
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

### Server Port
- Default: `3001`
- Configurable via `.env` file

---

## Model AI & Face Recognition

### Face Detection Model

#### Library: @vladmandic/human
Alternative yang lebih modern dari face-api.js dengan performa lebih baik.

Model yang Digunakan:
```
public/models/
├── tiny_face_detector_model         # Deteksi wajah (fast)
├── face_landmark_68_model           # Deteksi landmark wajah
├── face_recognition_model           # Generate face descriptor (128D vector)
└── ssd_mobilenetv1_model           # Alternative detector (accurate)
```

#### Configuration
```javascript
const humanConfig = {
  backend: 'webgl',
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { 
      enabled: true,
      maxDetected: 10,
      minConfidence: 0.5
    },
    description: { 
      enabled: true  // Generate face embeddings
    }
  }
};
```

### Face Matching Algorithm

#### Face Descriptor (Embedding)
- Setiap wajah direpresentasikan sebagai vector 128 dimensi
- Vector ini adalah "fingerprint" unik dari wajah

#### Similarity Measurement
Cosine Similarity:
```javascript
const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
```

Threshold:
- Similarity lebih dari 0.6 = Match (wajah sama)
- Similarity kurang dari atau sama dengan 0.6 = Unknown (wajah berbeda)

#### Face History Tracking
```javascript
const faceHistoryRef = useRef(new Map());

// Stabilitas deteksi: jika wajah sama terdeteksi 3x berturut-turut
// dengan confidence > threshold, baru dianggap match
```

### Conversational AI

#### OpenAI Integration
```javascript
// conversationAI.js
class ConversationalAI {
  constructor() {
    this.apiKey = 'YOUR_OPENAI_API_KEY';
    this.model = 'gpt-4' || 'gpt-3.5-turbo';
  }
  
  async chat(message) {
    // Build context dengan:
    // 1. Patient profile
    // 2. Known faces
    // 3. Today's routines
    // 4. Conversation history
    
    const response = await openai.chat.completions.create({
      model: this.model,
      messages: this.buildMessages(message)
    });
    
    return response.choices[0].message.content;
  }
}
```

#### System Prompt Context
```
Anda adalah asisten AI untuk pasien demensia.
Tugas Anda:
1. Membantu pasien mengingat nama dan relasi orang
2. Mengingatkan jadwal dan rutinitas
3. Menjawab pertanyaan dengan sabar dan jelas
4. Memberikan informasi berdasarkan profil pasien

Profil Pasien:
- Nama: {patient.name}
- Keluarga: {patient.familyMembers}
- Hobi: {patient.interests}

Jadwal Hari Ini:
{today's routines}

Kerabat Terdaftar:
{known faces}
```

### Speech Recognition & TTS

#### Web Speech API
```javascript
// speechRecognition.js
const recognition = new (window.SpeechRecognition || 
                         window.webkitSpeechRecognition)();

recognition.lang = 'id-ID';  // Bahasa Indonesia
recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Process speech input
};
```

#### Text-to-Speech
```javascript
// textToSpeech.js
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'id-ID';
utterance.rate = 0.9;
utterance.pitch = 1.0;

window.speechSynthesis.speak(utterance);
```

---

## Cara Menjalankan

### Prerequisites
```bash
# Install Node.js (v18+)
# Install npm atau yarn
```

### 1. Setup Backend

```bash
cd ARSIK_backend

# Install dependencies
npm install

# Create .env file (optional)
echo "PORT=3001" > .env

# Run server
npm start
```

Server akan berjalan di `http://localhost:3001`

### 2. Setup Frontend - Patient App

```bash
cd ARSIK

# Install dependencies
npm install

# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 3. Setup Frontend - Caregiver App (Desktop)

```bash
cd ARSIK_suster

# Install dependencies
npm install

# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5174`

### 4. Setup Frontend - Caregiver App (Mobile)

```bash
cd ARSIK_suster_mobile

# Install dependencies
npm install

# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5175`

### Build untuk Production

```bash
# Build frontend
npm run build

# Output ada di folder dist/
# Deploy dist/ folder ke hosting (Vercel, Netlify, dll)
```

### Environment Variables

Backend (.env):
PORT=3001
NODE_ENV=production

Frontend (Vite):
// vite.config.js
export default defineConfig({
  server: {
    port: 5173
  }
});

---

## Troubleshooting

### Face Detection Tidak Bekerja
- Pastikan browser support WebRTC dan camera access
- Check HTTPS (beberapa browser hanya allow camera di HTTPS)
- Verify model files ada di `/public/models/`

### CORS Error
- Pastikan backend CORS sudah dikonfigurasi untuk frontend URL
- Check `server.js` - bagian `cors()` configuration

### LocalStorage Full
```javascript
// Clear all data
localStorage.removeItem('dementia_app_faces');
localStorage.removeItem('arsik_patient_id');
localStorage.removeItem('arsik_patient_profile');
```

### Backend Connection Failed
- Pastikan backend running di port 3001
- Check API_BASE_URL di `apiClient.js`
- Verify no firewall blocking

---

## Kontributor

Tim Altair - Hackathon ITB 2025

---

## Lisensi

Proyek ini dibuat untuk keperluan kompetisi/pendidikan.

---

Dokumentasi Versi: 1.0
Terakhir Diperbarui: 26 November 2025
