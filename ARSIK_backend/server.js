import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large base64 images

// In-memory storage (use database in production)
const pendingApprovals = new Map(); // id -> { id, name, relation, descriptor, imageData, patientId, timestamp, status }
const approvedPeople = new Map();   // id -> { id, name, relation, descriptor, imageData, patientId, approvedAt }
const routines = new Map();         // id -> { id, patientId, activityName, dateTime, isRecurring, frequency, createdBy, createdAt, notified }

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
    const { patientId, activityName, dateTime, isRecurring, frequency } = req.body;

    if (!patientId || !activityName || !dateTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const routine = {
      id,
      patientId,
      activityName,
      dateTime: new Date(dateTime).toISOString(),
      isRecurring: isRecurring || false,
      frequency: frequency || null, // 'daily', 'weekly', 'monthly'
      createdBy: 'caregiver',
      createdAt: new Date().toISOString(),
      notified: false
    };

    routines.set(id, routine);

    console.log(`[ROUTINE] New routine created for patient ${patientId}: ${activityName} at ${dateTime}`);

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
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);

    const pendingRoutines = Array.from(routines.values())
      .filter(r => {
        if (r.patientId !== patientId) return false;
        const routineTime = new Date(r.dateTime);
        return routineTime <= fiveMinutesLater && routineTime >= now && !r.notified;
      });

    // Mark as notified
    pendingRoutines.forEach(r => {
      const routine = routines.get(r.id);
      if (routine) {
        routine.notified = true;
        routines.set(r.id, routine);
      }
    });

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
  console.log(`   - POST   /api/admin/clear-all                 - Clear all data (⚠️  ADMIN)`);
  console.log(`   - GET    /api/health                          - Health check\n`);
});
