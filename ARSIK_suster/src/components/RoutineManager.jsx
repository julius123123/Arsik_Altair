import { useState, useEffect } from 'react';
import { createRoutine, getRoutines, deleteRoutine } from '../utils/caregiverApi';
import './RoutineManager.css';

const RoutineManager = () => {
  const [routines, setRoutines] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    activityName: '',
    date: '',
    time: '',
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
    
    // Combine date and time
    const dateTime = `${formData.date}T${formData.time}:00`;
    
    const routineData = {
      patientId: formData.patientId,
      activityName: formData.activityName,
      dateTime,
      isRecurring: formData.isRecurring,
      frequency: formData.isRecurring ? formData.frequency : null
    };

    const result = await createRoutine(routineData);
    if (result.success) {
      setShowAddForm(false);
      setFormData({
        patientId: '',
        activityName: '',
        date: '',
        time: '',
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

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateTime) => {
    return new Date(dateTime) > new Date();
  };

  const isPast = (dateTime) => {
    return new Date(dateTime) < new Date();
  };

  const upcomingRoutines = routines.filter(r => isUpcoming(r.dateTime));
  const pastRoutines = routines.filter(r => isPast(r.dateTime));

  return (
    <div className="routine-manager">
      <div className="routine-header">
        <h2>📅 Patient Routines & Reminders</h2>
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
                placeholder="e.g., Minum obat, Makan siang, Olahraga"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time:</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
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

      <div className="routines-section">
        <h3>Upcoming Routines ({upcomingRoutines.length})</h3>
        {upcomingRoutines.length === 0 ? (
          <p className="no-routines">No upcoming routines</p>
        ) : (
          <div className="routines-list">
            {upcomingRoutines.map(routine => (
              <div key={routine.id} className="routine-card upcoming">
                <div className="routine-icon">⏰</div>
                <div className="routine-info">
                  <h4>{routine.activityName}</h4>
                  <p className="routine-time">{formatDateTime(routine.dateTime)}</p>
                  <p className="routine-patient">Patient: {routine.patientId}</p>
                  {routine.isRecurring && (
                    <span className="badge-recurring">🔄 {routine.frequency}</span>
                  )}
                </div>
                <button
                  className="btn-delete-routine"
                  onClick={() => handleDelete(routine.id, routine.activityName)}
                  title="Delete routine"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="routines-section">
        <h3>Past Routines ({pastRoutines.length})</h3>
        {pastRoutines.length === 0 ? (
          <p className="no-routines">No past routines</p>
        ) : (
          <div className="routines-list">
            {pastRoutines.map(routine => (
              <div key={routine.id} className="routine-card past">
                <div className="routine-icon">✓</div>
                <div className="routine-info">
                  <h4>{routine.activityName}</h4>
                  <p className="routine-time">{formatDateTime(routine.dateTime)}</p>
                  <p className="routine-patient">Patient: {routine.patientId}</p>
                  {routine.notified && (
                    <span className="badge-notified">📢 Notified</span>
                  )}
                </div>
                <button
                  className="btn-delete-routine"
                  onClick={() => handleDelete(routine.id, routine.activityName)}
                  title="Delete routine"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineManager;
