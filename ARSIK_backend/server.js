import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large base64 images

// In-memory storage (use database in production)
const pendingApprovals = new Map(); // id -> { id, name, relation, descriptor, imageData, patientId, timestamp, status }
const approvedPeople = new Map();   // id -> { id, name, relation, descriptor, imageData, patientId, approvedAt }
const routines = new Map();         // id -> { id, patientId, activityName, dateTime, isRecurring, frequency, createdBy, createdAt, notified }
const patientProfiles = new Map();  // patientId -> { name, age, interests, familyMembers }
const conversationHistory = new Map(); // patientId -> [ { role, content, timestamp } ]

// Gemini API configuration from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// ============================================
// PATIENT APP ENDPOINTS (ARSIK)
// ============================================

// Submit new person for approval
app.post('/api/pending', (req, res) => {
  try {
    const { name, relation, descriptor, imageData, patientId } = req.body;

    if (!name || !relation || !descriptor || !imageData || !patientId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const pendingPerson = {
      id,
      name,
      relation,
      descriptor,
      imageData,
      patientId,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    pendingApprovals.set(id, pendingPerson);

    console.log(`[PENDING] New request from patient ${patientId}: ${name} (${relation})`);

    res.json({
      success: true,
      id,
      message: 'Submitted for caregiver approval'
    });
  } catch (error) {
    console.error('Error submitting pending approval:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get approved people for a patient
app.get('/api/approved/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    
    const approved = Array.from(approvedPeople.values())
      .filter(person => person.patientId === patientId);

    res.json({
      success: true,
      people: approved
    });
  } catch (error) {
    console.error('Error getting approved people:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check status of pending request
app.get('/api/pending/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const pending = pendingApprovals.get(id);

    if (!pending) {
      // Check if it was approved
      const approved = approvedPeople.get(id);
      if (approved) {
        return res.json({
          success: true,
          status: 'approved',
          person: approved
        });
      }
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({
      success: true,
      status: pending.status,
      person: pending.status === 'approved' ? pending : null
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// CAREGIVER APP ENDPOINTS (ARSIK_suster)
// ============================================

// Get all pending approvals
app.get('/api/caregiver/pending', (req, res) => {
  try {
    const pending = Array.from(pendingApprovals.values())
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      pending
    });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve a pending request
app.post('/api/caregiver/approve/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, relation } = req.body; // Caregiver can edit name/relation

    const pending = pendingApprovals.get(id);

    if (!pending) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (pending.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Move to approved
    const approvedPerson = {
      ...pending,
      name: name || pending.name, // Use caregiver's edit or original
      relation: relation || pending.relation,
      status: 'approved',
      approvedAt: new Date().toISOString()
    };

    approvedPeople.set(id, approvedPerson);
    pendingApprovals.delete(id);

    console.log(`[APPROVED] ${approvedPerson.name} (${approvedPerson.relation}) for patient ${approvedPerson.patientId}`);

    res.json({
      success: true,
      message: 'Person approved',
      person: approvedPerson
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a pending request
app.post('/api/caregiver/reject/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const pending = pendingApprovals.get(id);

    if (!pending) {
      return res.status(404).json({ error: 'Request not found' });
    }

    pending.status = 'rejected';
    pending.rejectedAt = new Date().toISOString();
    pending.rejectionReason = reason;

    console.log(`[REJECTED] ${pending.name} (${pending.relation}) - Reason: ${reason}`);

    // Remove after 1 hour
    setTimeout(() => {
      pendingApprovals.delete(id);
    }, 3600000);

    res.json({
      success: true,
      message: 'Person rejected'
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all approved people (for caregiver to review)
app.get('/api/caregiver/approved', (req, res) => {
  try {
    const approved = Array.from(approvedPeople.values())
      .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));

    res.json({
      success: true,
      approved
    });
  } catch (error) {
    console.error('Error getting approved people:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete an approved person
app.delete('/api/caregiver/approved/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (approvedPeople.delete(id)) {
      console.log(`[DELETED] Approved person ${id}`);
      res.json({ success: true, message: 'Person deleted' });
    } else {
      res.status(404).json({ error: 'Person not found' });
    }
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload face directly (Caregiver) - bypasses approval process
app.post('/api/caregiver/upload-face', (req, res) => {
  try {
    const { name, relation, imageData, patientId } = req.body;

    if (!name || !relation || !imageData || !patientId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    
    // Note: descriptor will be null since caregiver uploads image without face detection
    // Patient app will need to generate descriptor when it processes the image
    const approvedPerson = {
      id,
      name,
      relation,
      descriptor: null, // Will be generated by patient app on first detection
      imageData,
      patientId,
      approvedAt: new Date().toISOString(),
      uploadedByCaregiver: true
    };

    approvedPeople.set(id, approvedPerson);

    console.log(`[UPLOAD] Caregiver uploaded face: ${name} (${relation}) for patient ${patientId}`);

    res.json({
      success: true,
      person: approvedPerson,
      message: 'Face uploaded successfully'
    });
  } catch (error) {
    console.error('[UPLOAD] Error uploading face:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    pendingCount: pendingApprovals.size,
    approvedCount: approvedPeople.size
  });
});

// ============================================
// ROUTINE/REMINDER ENDPOINTS
// ============================================

// Create new routine (Caregiver)
app.post('/api/caregiver/routines', (req, res) => {
  try {
    const { patientId, activityName, dateTime, startTime, endTime, isRecurring, frequency } = req.body;

    if (!patientId || !activityName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const routine = {
      id,
      patientId,
      activityName,
      dateTime: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
      startTime: startTime || null,
      endTime: endTime || null,
      isRecurring: isRecurring || false,
      frequency: frequency || null, // 'daily', 'weekly', 'monthly'
      createdBy: 'caregiver',
      createdAt: new Date().toISOString(),
      notified: false
    };

    routines.set(id, routine);

    console.log(`[ROUTINE] New routine created for patient ${patientId}: ${activityName} (${startTime} - ${endTime})`);

    res.json({
      success: true,
      routine
    });
  } catch (error) {
    console.error('[ROUTINE] Error creating routine:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all routines for a patient
app.get('/api/routines/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patientRoutines = Array.from(routines.values())
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    res.json({
      success: true,
      routines: patientRoutines
    });
  } catch (error) {
    console.error('[ROUTINE] Error getting routines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending routines (due now or in next 5 minutes)
app.get('/api/routines/:patientId/pending', (req, res) => {
  try {
    const { patientId } = req.params;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
    const laterTime = fiveMinutesLater.toTimeString().slice(0, 5);

    const pendingRoutines = Array.from(routines.values())
      .filter(r => {
        if (r.patientId !== patientId) return false;
        if (r.notified) return false;
        
        // Check if routine is active based on startTime/endTime
        if (r.startTime && r.endTime) {
          // Check if current time is within or approaching the routine window
          return currentTime >= r.startTime && currentTime <= r.endTime;
        }
        
        // Fallback to dateTime check for backward compatibility
        if (r.dateTime) {
          const routineTime = new Date(r.dateTime);
          return routineTime <= fiveMinutesLater && routineTime >= now;
        }
        
        return false;
      });

    // Mark as notified
    pendingRoutines.forEach(r => {
      const routine = routines.get(r.id);
      if (routine) {
        routine.notified = true;
        routines.set(r.id, routine);
      }
    });

    if (pendingRoutines.length > 0) {
      console.log(`[ROUTINE] Found ${pendingRoutines.length} pending routines for patient ${patientId}`);
    }

    res.json({
      success: true,
      routines: pendingRoutines
    });
  } catch (error) {
    console.error('[ROUTINE] Error getting pending routines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete routine (Caregiver)
app.delete('/api/caregiver/routines/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const routine = routines.get(id);
    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    routines.delete(id);
    console.log(`[ROUTINE] Deleted routine: ${routine.activityName}`);

    res.json({
      success: true,
      message: 'Routine deleted'
    });
  } catch (error) {
    console.error('[ROUTINE] Error deleting routine:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all routines (Caregiver view)
app.get('/api/caregiver/routines', (req, res) => {
  try {
    const allRoutines = Array.from(routines.values())
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    res.json({
      success: true,
      routines: allRoutines
    });
  } catch (error) {
    console.error('[ROUTINE] Error getting all routines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all data (for testing/reset purposes)
app.post('/api/admin/clear-all', (req, res) => {
  const pendingCount = pendingApprovals.size;
  const approvedCount = approvedPeople.size;
  const routinesCount = routines.size;
  
  pendingApprovals.clear();
  approvedPeople.clear();
  routines.clear();
  
  console.log(`[ADMIN] ⚠️ All data cleared! (${pendingCount} pending + ${approvedCount} approved + ${routinesCount} routines)`);
  
  res.json({
    success: true,
    message: 'All data cleared from server',
    cleared: {
      pending: pendingCount,
      approved: approvedCount,
      routines: routinesCount
    }
  });
});

// ============================================
// AI CONVERSATION ENDPOINTS
// ============================================

// Get AI configuration (patient profile only)
app.get('/api/ai-config', (req, res) => {
  try {
    res.json({
      patientProfile: {},
      configured: !!GEMINI_API_KEY
    });
  } catch (error) {
    console.error('Error getting AI config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save patient profile
app.post('/api/patient-profile', (req, res) => {
  try {
    const { patientId, profile } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID required' });
    }

    patientProfiles.set(patientId, profile);

    console.log(`[PROFILE] Updated for patient ${patientId}`);

    res.json({
      success: true,
      message: 'Profile saved'
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get patient profile
app.get('/api/patient-profile/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const profile = patientProfiles.get(patientId) || {};

    res.json({ profile });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate conversation response using Gemini
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { patientId, systemPrompt, messages } = req.body;

    if (!GEMINI_API_KEY || !model) {
      return res.json({
        success: false,
        error: 'API key not configured',
        response: 'AI belum dikonfigurasi. GEMINI_API_KEY tidak ditemukan di environment.'
      });
    }

    // Save conversation history
    const history = conversationHistory.get(patientId) || [];
    messages.forEach(msg => {
      if (!history.find(h => h.content === msg.content && h.role === msg.role)) {
        history.push({
          ...msg,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Keep last 20 messages
    while (history.length > 20) {
      history.shift();
    }

    conversationHistory.set(patientId, history);

    // Build the full prompt with system instructions and conversation
    let fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    
    // Add conversation history
    messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n`;
      }
    });
    
    fullPrompt += '\nAssistant:';

    console.log('[AI CHAT] Calling Gemini API...');
    console.log('[AI CHAT] Prompt length:', fullPrompt.length);

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('[AI CHAT] Success! Response:', aiResponse);
    console.log('[AI CHAT] Response length:', aiResponse.length);

    res.json({
      success: true,
      response: aiResponse,
      tokensUsed: 0 // SDK doesn't expose token count easily
    });
  } catch (error) {
    console.error('[AI CHAT] Error:', error.message);
    res.json({
      success: false,
      error: error.message,
      response: 'Maaf, terjadi kesalahan saat menghubungi AI.'
    });
  }
});

// Get conversation summary
app.get('/api/ai-summary/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const history = conversationHistory.get(patientId) || [];

    res.json({
      totalMessages: history.length,
      recentMessages: history.slice(-10),
      firstMessage: history[0]?.timestamp,
      lastMessage: history[history.length - 1]?.timestamp
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ARSIK Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   - POST   /api/pending                         - Submit for approval`);
  console.log(`   - GET    /api/approved/:patientId             - Get approved people`);
  console.log(`   - GET    /api/caregiver/pending               - Get pending requests`);
  console.log(`   - POST   /api/caregiver/approve/:id           - Approve request`);
  console.log(`   - POST   /api/caregiver/reject/:id            - Reject request`);
  console.log(`   - POST   /api/caregiver/upload-face           - Upload face directly (⬆️ NEW)`);
  console.log(`   - GET    /api/caregiver/approved              - Get all approved people`);
  console.log(`   - DELETE /api/caregiver/approved/:id          - Delete approved person`);
  console.log(`   - POST   /api/caregiver/routines              - Create routine`);
  console.log(`   - GET    /api/caregiver/routines              - Get all routines`);
  console.log(`   - DELETE /api/caregiver/routines/:id          - Delete routine`);
  console.log(`   - GET    /api/routines/:patientId             - Get patient routines`);
  console.log(`   - GET    /api/routines/:patientId/pending     - Get pending routines`);
  console.log(`   - GET    /api/ai-config                       - Get AI config (🤖 NEW)`);
  console.log(`   - POST   /api/patient-profile                 - Save patient profile (🤖 NEW)`);
  console.log(`   - GET    /api/patient-profile/:patientId      - Get patient profile (🤖 NEW)`);
  console.log(`   - POST   /api/ai-chat                         - AI chat with Gemini (🤖 NEW)`);
  console.log(`   - GET    /api/ai-summary/:patientId           - Get conversation summary (🤖 NEW)`);
  console.log(`   - POST   /api/admin/clear-all                 - Clear all data (⚠️  ADMIN)`);
  console.log(`   - GET    /api/health                          - Health check`);
  console.log(`\n🤖 Gemini API: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured (set GEMINI_API_KEY env var)'}\n`);
});
