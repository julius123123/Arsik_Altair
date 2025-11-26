import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getRoutines, deleteRoutine } from '../utils/caregiverApi';
import './Routine.css';

function Routine() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
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
    setLoading(false);
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
    if (routine.startTime && routine.endTime) {
      return `${routine.startTime} - ${routine.endTime}`;
    }
    if (routine.startTime) {
      return routine.startTime;
    }
    if (routine.endTime) {
      return routine.endTime;
    }
    if (routine.dateTime) {
      const date = new Date(routine.dateTime);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return 'No time set';
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <Link to="/routine/add" className="btn btn-primary btn-block">
          + Tambah Rutinitas Baru
        </Link>

        {loading ? (
          <div className="loading-message">Loading routines...</div>
        ) : routines.length === 0 ? (
          <div className="empty-message">
            <p>No routines available.</p>
            <p>Add some activities to get started!</p>
          </div>
        ) : (
          <div className="routine-list">
            {routines.map(routine => (
              <div key={routine.id} className="routine-card">
                <div className="routine-info">
                  <h3 className="routine-name">{routine.activityName}</h3>
                  <div className="routine-time">
                    <span className="time-icon">🕐</span> {formatTimeRange(routine)}
                  </div>
                  {routine.isRecurring && (
                    <div className="routine-recurring">
                      🔁 {routine.frequency}
                    </div>
                  )}
                </div>
                <div className="routine-actions">
                  <span className="status-badge status-active">Active</span>
                  <button 
                    className="btn-delete-small"
                    onClick={() => handleDelete(routine.id, routine.activityName)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="routine" />
    </div>
  );
}

export default Routine;
