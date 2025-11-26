// API client for ARSIK backend
const API_BASE_URL = 'http://localhost:3001/api';

// Get unique patient ID (generate once and store)
export const getPatientId = () => {
  let patientId = localStorage.getItem('arsik_patient_id');
  if (!patientId) {
    patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('arsik_patient_id', patientId);
  }
  return patientId;
};

// Submit person for caregiver approval
export const submitForApproval = async (personData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...personData,
        patientId: getPatientId(),
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting for approval:', error);
    return { success: false, error: error.message };
  }
};

// Get all approved people for this patient
export const getApprovedPeople = async () => {
  try {
    const patientId = getPatientId();
    const response = await fetch(`${API_BASE_URL}/approved/${patientId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting approved people:', error);
    return { success: false, error: error.message, people: [] };
  }
};

// Check status of a pending request
export const checkPendingStatus = async (requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pending/${requestId}/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking status:', error);
    return { success: false, error: error.message };
  }
};

// Sync approved people from server to local storage
export const syncApprovedPeople = async () => {
  try {
    const { success, people } = await getApprovedPeople();
    if (success && people) {
      // Merge with local storage
      const localKey = 'dementia_app_faces';
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      
      // Add server-approved people that aren't already local
      const existingIds = new Set(existing.map(p => p.serverId).filter(Boolean));
      const newPeople = people
        .filter(p => !existingIds.has(p.id))
        .map(p => ({
          id: `server_${p.id}`,
          serverId: p.id,
          name: p.name,
          relation: p.relation,
          descriptor: p.descriptor,
          imageData: p.imageData,
          addedDate: p.approvedAt,
          lastSeen: p.approvedAt,
          source: 'approved',
        }));

      const updated = [...existing, ...newPeople];
      localStorage.setItem(localKey, JSON.stringify(updated));
      
      console.log(`Synced ${newPeople.length} approved people from server`);
      return { success: true, count: newPeople.length };
    }
    return { success: false, count: 0 };
  } catch (error) {
    console.error('Error syncing approved people:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// ============================================
// ROUTINE/REMINDER API
// ============================================

// Get pending routines (due now or soon)
export const getPendingRoutines = async () => {
  try {
    const patientId = getPatientId();
    const response = await fetch(`${API_BASE_URL}/routines/${patientId}/pending`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting pending routines:', error);
    return { success: false, error: error.message, routines: [] };
  }
};

// Get all routines for this patient
export const getPatientRoutines = async () => {
  try {
    const patientId = getPatientId();
    const response = await fetch(`${API_BASE_URL}/routines/${patientId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting patient routines:', error);
    return { success: false, error: error.message, routines: [] };
  }
};
