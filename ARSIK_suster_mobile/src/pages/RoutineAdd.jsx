import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoutine, getRoutines } from '../utils/caregiverApi';
import './RoutineAdd.css';

function RoutineAdd() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    activityName: '',
    startTime: '',
    endTime: '',
    isRecurring: false,
    frequency: 'daily'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  useEffect(() => {
    loadRoutines();
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
      alert('✅ Routine created successfully!');
      navigate('/routine');
    } else {
      alert('❌ Failed to create routine: ' + result.error);
    }
  };

  const formatTimeRange = (routine) => {
    if (routine.startTime && routine.endTime) {
      return `${routine.startTime} - ${routine.endTime}`;
    }
    if (routine.startTime) return routine.startTime;
    if (routine.endTime) return routine.endTime;
    return '';
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <h2 className="page-title">Rutinitas Baru</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Patient ID (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="Leave blank to auto-detect"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Rutinitas</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Sarapan, Minum Obat"
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Waktu Mulai</label>
            <input
              type="time"
              className="input"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Waktu Selesai</label>
            <input
              type="time"
              className="input"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              />
              <span>Recurring routine</span>
            </label>
          </div>

          {formData.isRecurring && (
            <div className="form-group">
              <label className="form-label">Pengulangan</label>
              <select
                className="input"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <div className="button-group-vertical">
            <button type="submit" className="btn btn-primary">Simpan</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/routine')}>
              Batal
            </button>
          </div>
        </form>

        {/* Active Routines Preview */}
        {routines.length > 0 && (
          <div className="section">
            <h3 className="section-title">Rutinitas Aktif</h3>
            {routines.map(routine => (
              <div key={routine.id} className="routine-preview-list">
                <div className="routine-preview">
                  <span className="routine-preview-name">{routine.activityName}</span>
                  <span className="status-badge status-active">Active</span>
                </div>
                <div className="routine-preview">
                  <span className="routine-preview-time">🕐 {formatTimeRange(routine)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutineAdd;
