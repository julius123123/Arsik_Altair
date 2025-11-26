# ARSIK - AI-Based Dementia Patient Care System
## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARSIK SYSTEM ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────┐    ┌──────────────────────────────────┐│
│  │     PATIENT APP (ARSIK)         │    │  CAREGIVER MOBILE APP            ││
│  │     React + Vite                │    │  (ARSIK_suster_mobile)           ││
│  │     Port: 5173                  │    │  React + Vite                    ││
│  │                                 │    │  Port: 5174                      ││
│  │  ┌──────────────────────────┐  │    │                                  ││
│  │  │ Face Recognition         │  │    │  ┌────────────────────────────┐  ││
│  │  │ - Human Library          │  │    │  │ Home Dashboard             │  ││
│  │  │ - MediaPipe BlazeFace    │  │    │  │ - System Overview          │  ││
│  │  │ - Real-time Detection    │  │    │  │ - Quick Stats              │  ││
│  │  │ - Box Drawing (colored)  │  │    │  └────────────────────────────┘  ││
│  │  └──────────────────────────┘  │    │                                  ││
│  │                                 │    │  ┌────────────────────────────┐  ││
│  │  ┌──────────────────────────┐  │    │  │ Routine Management         │  ││
│  │  │ AI Conversation Assistant│  │    │  │ - Create/Delete Routines   │  ││
│  │  │ - Voice Input (Web Speech)│ │    │  │ - Recurring Options        │  ││
│  │  │ - TTS Output             │  │    │  │ - Time Management          │  ││
│  │  │ - Context Awareness      │  │    │  └────────────────────────────┘  ││
│  │  │ - Auto-restart Mic       │  │    │                                  ││
│  │  └──────────────────────────┘  │    │  ┌────────────────────────────┐  ││
│  │                                 │    │  │ Add Face Data              │  ││
│  │  ┌──────────────────────────┐  │    │  │ - File Upload              │  ││
│  │  │ Routine Notifications    │  │    │  │ - Face Detection           │  ││
│  │  │ - Timer Circle Animation │  │    │  │ - Descriptor Extraction    │  ││
│  │  │ - TTS Announcements      │  │    │  │ - Direct Approval          │  ││
│  │  │ - Auto-dismiss           │  │    │  └────────────────────────────┘  ││
│  │  └──────────────────────────┘  │    │                                  ││
│  │                                 │    │  ┌────────────────────────────┐  ││
│  │  ┌──────────────────────────┐  │    │  │ Inbox (Approvals)          │  ││
│  │  │ Location Tracker         │  │    │  │ - View Pending Requests    │  ││
│  │  │ - GPS Monitoring         │  │    │  │ - Approve/Reject Faces     │  ││
│  │  │ - Real-time Updates      │  │    │  │ - Edit Name/Relation       │  ││
│  │  │ - Visual Indicator       │  │    │  └────────────────────────────┘  ││
│  │  └──────────────────────────┘  │    │                                  ││
│  │                                 │    │  ┌────────────────────────────┐  ││
│  │  ┌──────────────────────────┐  │    │  │ Location Alerts            │  ││
│  │  │ People List              │  │    │  │ - View Out-of-Bounds       │  ││
│  │  │ - Approved Faces         │  │    │  │ - Distance Info            │  ││
│  │  │ - Last Seen              │  │    │  │ - Google Maps Link         │  ││
│  │  └──────────────────────────┘  │    │  │ - Acknowledge Alerts       │  ││
│  └─────────────────────────────────┘    │  └────────────────────────────┘  ││
│                                          │                                  ││
│                                          │  ┌────────────────────────────┐  ││
│                                          │  │ Profile & Settings         │  ││
│                                          │  │ - Patient Info Input       │  ││
│                                          │  │ - AI Prompt Configuration  │  ││
│                                          │  │ - Home Location Setup      │  ││
│                                          │  │ - Radius Configuration     │  ││
│                                          │  └────────────────────────────┘  ││
│                                          └──────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
                                    ▲  ▼
                          REST API (HTTP/JSON)
                                    ▲  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND SERVER                                   │
│                         ARSIK_backend (Express.js)                            │
│                              Port: 3001                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           API ENDPOINTS                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  Face Recognition Endpoints:                                            │ │
│  │  • POST   /api/pending              - Submit unknown face for approval  │ │
│  │  • GET    /api/approved/:patientId  - Get approved faces               │ │
│  │  • POST   /api/approved             - Add face directly (caregiver)    │ │
│  │  • GET    /api/caregiver/pending    - Get pending approvals            │ │
│  │  • POST   /api/caregiver/approve/:id - Approve face request            │ │
│  │  • POST   /api/caregiver/reject/:id  - Reject face request             │ │
│  │  • DELETE /api/caregiver/approved/:id - Delete approved face           │ │
│  │                                                                          │ │
│  │  Routine Management Endpoints:                                          │ │
│  │  • POST   /api/caregiver/routines   - Create routine                   │ │
│  │  • GET    /api/caregiver/routines   - Get all routines                 │ │
│  │  • DELETE /api/caregiver/routines/:id - Delete routine                 │ │
│  │  • GET    /api/routines/:patientId  - Get patient routines             │ │
│  │  • GET    /api/routines/:patientId/pending - Get pending routines      │ │
│  │                                                                          │ │
│  │  AI & Profile Endpoints:                                                │ │
│  │  • GET    /api/ai-config            - Check AI configuration           │ │
│  │  • POST   /api/patient-profile      - Save patient profile             │ │
│  │  • GET    /api/patient-profile/:id  - Get patient profile              │ │
│  │  • POST   /api/ai-chat              - AI conversation (Gemini)         │ │
│  │  • GET    /api/ai-summary/:id       - Get conversation summary         │ │
│  │                                                                          │ │
│  │  Location Tracking Endpoints:                                           │ │
│  │  • POST   /api/patient-location     - Update patient GPS position      │ │
│  │  • POST   /api/home-location        - Set home checkpoint              │ │
│  │  • GET    /api/location-alerts      - Get out-of-bounds alerts         │ │
│  │  • POST   /api/location-alerts/:id/acknowledge - Acknowledge alert     │ │
│  │                                                                          │ │
│  │  System Endpoints:                                                      │ │
│  │  • GET    /api/health               - Health check                     │ │
│  │  • POST   /api/admin/clear-all      - Clear all data (admin)           │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        IN-MEMORY STORAGE                                 │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  Data Structures (Map):                                                 │ │
│  │  • pendingApprovals    - Unknown faces awaiting approval                │ │
│  │  • approvedPeople      - Approved faces with descriptors               │ │
│  │  • routines            - Patient routines & schedules                   │ │
│  │  • patientProfiles     - Patient info for AI personalization           │ │
│  │  • conversationHistory - AI chat history per patient                    │ │
│  │  • patientLocations    - Current GPS positions                          │ │
│  │  • homeLocations       - Home checkpoints (lat/lon/radius)             │ │
│  │  • locationAlerts      - Out-of-bounds alerts                           │ │
│  │                                                                          │ │
│  │  Note: In-memory storage - data lost on restart                         │ │
│  │        Use database (PostgreSQL/MongoDB) for production                 │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         CORE LOGIC                                       │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  • Face Descriptor Storage - Float32Array embeddings (512 dimensions)   │ │
│  │  • Routine Scheduling - Time-based notifications with recurring support │ │
│  │  • Location Monitoring - Haversine distance calculation                 │ │
│  │  • Alert Generation - Auto-create when distance > radius                │ │
│  │  • CORS Enabled - Cross-origin requests allowed                         │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ▲  ▼
                          External API Integration
                                    ▲  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Google Gemini AI API                                  │ │
│  │                   (gemini-2.5-flash model)                               │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  • Natural Language Understanding                                       │ │
│  │  • Context-aware responses                                              │ │
│  │  • Personalized interactions using patient profile                      │ │
│  │  • Memory support for dementia patients                                 │ │
│  │  • Conversation history tracking                                        │ │
│  │                                                                          │ │
│  │  Configuration: GEMINI_API_KEY in .env                                  │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Human.js Library (CDN)                                │ │
│  │              @vladmandic/human with MediaPipe                            │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  • Face Detection (BlazeFace)                                           │ │
│  │  • Face Recognition (FaceNet embeddings)                                │ │
│  │  • 512-dimensional face descriptors                                     │ │
│  │  • Cosine similarity matching (threshold: 0.6)                          │ │
│  │  • WebGL backend for performance                                        │ │
│  │                                                                          │ │
│  │  CDN: https://cdn.jsdelivr.net/npm/@vladmandic/human/models/           │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Browser APIs                                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  • Web Speech API - Voice input/output                                  │ │
│  │  • Geolocation API - GPS tracking                                       │ │
│  │  • MediaDevices API - Camera access                                     │ │
│  │  • localStorage - Client-side data persistence                          │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Google Maps                                           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │  • Location visualization                                               │ │
│  │  • Navigation to patient location                                       │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. FACE RECOGNITION FLOW                                                    │
│     Patient App → Camera → Human.js → Face Detection → Compare Descriptors   │
│     → Known? [Yes: Display Info] [No: Submit to Backend → Caregiver Inbox]  │
│     → Caregiver Reviews → Approve/Reject → Backend Updates → Patient Syncs   │
│                                                                               │
│  2. ROUTINE NOTIFICATION FLOW                                                │
│     Caregiver → Create Routine → Backend Storage → Patient App Polls (10s)   │
│     → Time Match? → Show Notification → TTS Announcement → Timer Animation   │
│     → Auto-dismiss at End Time                                               │
│                                                                               │
│  3. AI CONVERSATION FLOW                                                     │
│     Patient Voice → Web Speech API → Text → Backend → Gemini API             │
│     → Personalized Response (with profile context) → TTS → Patient Hears     │
│     → Auto-restart Mic (with delays to prevent echo)                         │
│                                                                               │
│  4. LOCATION TRACKING FLOW                                                   │
│     Patient App → Geolocation API → GPS Coords → Backend                     │
│     → Calculate Distance from Home → Distance > Radius?                      │
│     → [Yes: Create Alert] [No: Continue tracking]                            │
│     → Caregiver Views Alerts → Opens Maps → Acknowledges                     │
│                                                                               │
│  5. DIRECT FACE ADDITION FLOW                                                │
│     Caregiver → Upload Photo → Human.js Detection → Extract Descriptor       │
│     → Save Directly to Approved → Patient App Syncs → Immediate Recognition  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                           KEY FEATURES                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  PATIENT APP:                                                                │
│  ✓ Real-time face recognition with colored boxes (green/red)                 │
│  ✓ Voice-controlled AI assistant with context awareness                      │
│  ✓ Routine notifications with circular timer and TTS                         │
│  ✓ GPS tracking with visual out-of-bounds indicator                          │
│  ✓ Unknown face submission for caregiver approval                            │
│  ✓ Auto-reload patient profile every 30 seconds                              │
│  ✓ Microphone echo prevention (1300ms delays)                                │
│                                                                               │
│  CAREGIVER MOBILE APP:                                                       │
│  ✓ Dashboard with system overview                                            │
│  ✓ Routine management (create, recurring, delete)                            │
│  ✓ Direct face addition from gallery                                         │
│  ✓ Inbox for approving/rejecting face requests                               │
│  ✓ Location alerts with Google Maps integration                              │
│  ✓ Patient profile configuration for AI personalization                      │
│  ✓ Home location setup with adjustable radius                                │
│  ✓ Bottom navigation for easy access                                         │
│                                                                               │
│  BACKEND:                                                                    │
│  ✓ RESTful API with 30+ endpoints                                            │
│  ✓ Face descriptor storage and matching                                      │
│  ✓ Routine scheduling and notification triggers                              │
│  ✓ GPS distance calculation (Haversine formula)                              │
│  ✓ Automatic alert generation                                                │
│  ✓ AI conversation with Gemini integration                                   │
│  ✓ Patient profile management                                                │
│  ✓ CORS enabled for cross-origin requests                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         TECHNOLOGY STACK                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Frontend:                                                                   │
│  • React 19                     - UI framework                               │
│  • Vite 6                       - Build tool & dev server                    │
│  • React Router DOM 6           - Client-side routing                        │
│  • CSS3                         - Styling (no framework)                     │
│                                                                               │
│  Backend:                                                                    │
│  • Node.js                      - Runtime environment                        │
│  • Express.js                   - Web framework                              │
│  • @google/generative-ai        - Gemini SDK                                 │
│  • dotenv                       - Environment configuration                  │
│  • uuid                         - Unique ID generation                       │
│  • cors                         - Cross-origin support                       │
│                                                                               │
│  AI & ML:                                                                    │
│  • Google Gemini 2.5 Flash      - LLM for conversations                      │
│  • @vladmandic/human            - Face detection & recognition               │
│  • MediaPipe BlazeFace          - Face detector model                        │
│  • FaceNet                      - Face embedding model                       │
│                                                                               │
│  Browser APIs:                                                               │
│  • Web Speech API               - Voice recognition & synthesis              │
│  • Geolocation API              - GPS tracking                               │
│  • MediaDevices API             - Camera access                              │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT CONSIDERATIONS                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Current Setup (Development):                                                │
│  • Patient App:    localhost:5173                                            │
│  • Caregiver App:  localhost:5174                                            │
│  • Backend:        localhost:3001                                            │
│  • Storage:        In-memory (Maps) - data lost on restart                   │
│                                                                               │
│  Production Recommendations:                                                 │
│  • Use PostgreSQL or MongoDB for persistent storage                          │
│  • Deploy backend on cloud (AWS, GCP, Azure)                                 │
│  • Deploy frontend on Vercel, Netlify, or similar                            │
│  • Use HTTPS for all communications                                          │
│  • Implement authentication & authorization                                  │
│  • Add rate limiting for API endpoints                                       │
│  • Store face images in S3/Cloud Storage                                     │
│  • Use Redis for caching and sessions                                        │
│  • Implement WebSocket for real-time alerts                                  │
│  • Add monitoring & logging (Sentry, LogRocket)                              │
│  • Backup strategy for patient data                                          │
│  • HIPAA compliance for healthcare data                                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY NOTES                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  • Fixed patient ID (patient_001) - should be dynamic in production          │
│  • No authentication - implement JWT or OAuth                                │
│  • API key in environment variables (.env) - secure storage needed           │
│  • Face images stored as base64 - consider encrypted storage                 │
│  • GPS data sensitive - ensure secure transmission                           │
│  • CORS wide open - restrict to specific origins in production               │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
PATIENT APP                    BACKEND                    CAREGIVER APP
    │                             │                             │
    │  Face Detection             │                             │
    ├─────────────────────────────>│                             │
    │  GET /api/approved          │                             │
    │<─────────────────────────────┤                             │
    │  Approved Faces List        │                             │
    │                             │                             │
    │  Unknown Face Found         │                             │
    ├─────────────────────────────>│                             │
    │  POST /api/pending          │                             │
    │                             ├────────────────────────────>│
    │                             │  Notification               │
    │                             │                             │
    │                             │  GET /api/caregiver/pending │
    │                             │<────────────────────────────┤
    │                             │  Pending List               │
    │                             ├────────────────────────────>│
    │                             │                             │
    │                             │  POST /api/caregiver/approve│
    │  Sync Approved Faces        │<────────────────────────────┤
    │<─────────────────────────────┤                             │
    │  GET /api/approved          │                             │
    │                             │                             │
    │  Voice Input                │                             │
    ├─────────────────────────────>│  POST /api/ai-chat         │
    │                             ├────────────────────────────>│
    │                             │  Gemini API                 │
    │                             │<────────────────────────────┤
    │<─────────────────────────────┤  AI Response               │
    │  TTS Output                 │                             │
    │                             │                             │
    │  GPS Update                 │                             │
    ├─────────────────────────────>│                             │
    │  POST /api/patient-location │                             │
    │<─────────────────────────────┤                             │
    │  Distance Status            │                             │
    │                             │  Alert Created              │
    │                             ├────────────────────────────>│
    │                             │  GET /api/location-alerts   │
    │                             │<────────────────────────────┤
    │                             │                             │
    │  Poll Routines (10s)        │                             │
    ├─────────────────────────────>│                             │
    │  GET /api/routines/pending  │  POST /api/caregiver/routines
    │<─────────────────────────────┤<────────────────────────────┤
    │  Routine List               │                             │
    │  Show Notification          │                             │
```
