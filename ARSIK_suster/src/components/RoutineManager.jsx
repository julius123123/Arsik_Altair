import { useState, useEffect } from 'react';
import { createRoutine, getRoutines, deleteRoutine } from '../utils/caregiverApi';
import './RoutineManager.css';

const RoutineManager = () => {
  const [routines, setRoutines] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    activityName: '',
    startTime: '',
    endTime: '',
    isRecurring: false,
    frequency: 'daily'
  });

  useEffect(() => {
    loadRoutines();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadRoutines, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRoutines = async () => {
    const result = await getRoutines();
    if (result.success) {
      setRoutines(result.routines);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get today's date for the routine
    const today = new Date().toISOString().split('T')[0];
    const dateTime = `${today}T${formData.startTime}:00`;
    
    const routineData = {
      patientId: formData.patientId,
      activityName: formData.activityName,
      dateTime,
      startTime: formData.startTime,
      endTime: formData.endTime,
      isRecurring: formData.isRecurring,
      frequency: formData.isRecurring ? formData.frequency : null
    };

    const result = await createRoutine(routineData);
    if (result.success) {
      setShowAddForm(false);
      setFormData({
        patientId: '',
        activityName: '',
        startTime: '',
        endTime: '',
        isRecurring: false,
        frequency: 'daily'
      });
      loadRoutines();
      alert('✅ Routine created successfully!');
    } else {
      alert('❌ Failed to create routine: ' + result.error);
    }
  };

  const handleDelete = async (id, activityName) => {
    if (window.confirm(`Delete routine: ${activityName}?`)) {
      const result = await deleteRoutine(id);
      if (result.success) {
        loadRoutines();
        alert('✅ Routine deleted');
      } else {
        alert('❌ Failed to delete routine');
      }
    }
  };

  const formatTimeRange = (routine) => {
    // Handle both old format (dateTime) and new format (startTime/endTime)
    if (routine.startTime && routine.endTime) {
      return `${routine.startTime} - ${routine.endTime}`;
    }
    if (routine.startTime) {
      return routine.startTime;
    }
    if (routine.endTime) {
      return routine.endTime;
    }
    // Fallback to dateTime if available
    if (routine.dateTime) {
      const date = new Date(routine.dateTime);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return 'No time set';
  };

  return (
    <div className="routine-manager">
      <div className="routine-header-container">
        <h1 className="routine-title">Kegiatan Harian</h1>
        <button 
          className="btn-add-routine"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Routine'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-routine-form">
          <h3>Add New Routine</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Patient ID:</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                placeholder="Enter patient ID"
                required
              />
              <small>Leave blank to auto-detect from patient app</small>
            </div>

            <div className="form-group">
              <label>Activity Name:</label>
              <input
                type="text"
                value={formData.activityName}
                onChange={(e) => setFormData({...formData, activityName: e.target.value})}
                placeholder="e.g., Sarapan, Minum Obat, Mandi"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time:</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time:</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                />
                Recurring routine
              </label>
            </div>

            {formData.isRecurring && (
              <div className="form-group">
                <label>Frequency:</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                Create Routine
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="routines-grid">
        {routines.length === 0 ? (
          <p className="no-routines">No routines available. Add some activities to get started!</p>
        ) : (
          routines.map(routine => (
            <div key={routine.id} className="activity-card">
              <button
                className="btn-delete-activity"
                onClick={() => handleDelete(routine.id, routine.activityName)}
                title="Delete routine"
              >
                ✕
              </button>
              <h3 className="activity-name">{routine.activityName}</h3>
              <p className="activity-time">
                {formatTimeRange(routine)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoutineManager;
