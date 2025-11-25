// API client for caregiver app
const API_BASE_URL = 'http://localhost:3001/api/caregiver';

// Get all pending approval requests
export const getPendingRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pending`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { success: false, error: error.message, pending: [] };
  }
};

// Approve a request
export const approveRequest = async (id, updatedData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/approve/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData || {}),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error approving request:', error);
    return { success: false, error: error.message };
  }
};

// Reject a request
export const rejectRequest = async (id, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reject/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: reason || 'No reason provided' }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error rejecting request:', error);
    return { success: false, error: error.message };
  }
};

// Get all approved people
export const getApprovedPeople = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/approved`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting approved people:', error);
    return { success: false, error: error.message, approved: [] };
  }
};

// Delete an approved person
export const deletePerson = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/approved/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting person:', error);
    return { success: false, error: error.message };
  }
};

// Upload face directly (bypasses approval)
export const uploadFace = async (faceData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(faceData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading face:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ROUTINE/REMINDER API
// ============================================

// Create new routine
export const createRoutine = async (routineData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/routines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routineData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating routine:', error);
    return { success: false, error: error.message };
  }
};

// Get all routines
export const getRoutines = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/routines`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting routines:', error);
    return { success: false, error: error.message, routines: [] };
  }
};

// Delete routine
export const deleteRoutine = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting routine:', error);
    return { success: false, error: error.message };
  }
};
