import { useState, useEffect } from 'react';
import { getPatientRoutines } from '../utils/apiClient';
import './Jadwal.css';

const Jadwal = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    loadRoutines();
    // Refresh every 30 seconds
    const interval = setInterval(loadRoutines, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRoutines = async () => {
    setLoading(true);
    const result = await getPatientRoutines();
    if (result.success && result.routines) {
      const sortedRoutines = result.routines
        .filter(r => {
          // Filter to show today's and future routines
          if (r.startTime) {
            const routineDate = new Date();
            const [hours, minutes] = r.startTime.split(':');
            routineDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return routineDate >= new Date() || isToday(routineDate);
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by time
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return 0;
        });
      
      setRoutines(sortedRoutines);
      calculateProgress(sortedRoutines);
    }
    setLoading(false);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const calculateProgress = (routines) => {
    const now = new Date();
    const todayRoutines = routines.filter(r => {
      if (r.startTime) {
        const routineDate = new Date();
        const [hours, minutes] = r.startTime.split(':');
        routineDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return isToday(routineDate);
      }
      return false;
    });

    const completed = todayRoutines.filter(r => {
      const [hours, minutes] = r.endTime.split(':');
      const endTime = new Date();
      endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return now >= endTime;
    }).length;

    setTodayProgress({ completed, total: todayRoutines.length });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const getRoutineStatus = (routine) => {
    if (!routine.startTime || !routine.endTime) return 'upcoming';
    
    const now = new Date();
    const [startHours, startMinutes] = routine.startTime.split(':');
    const [endHours, endMinutes] = routine.endTime.split(':');
    
    const startTime = new Date();
    startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const endTime = new Date();
    endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    if (now >= endTime) return 'completed';
    if (now >= startTime && now < endTime) return 'ongoing';
    return 'upcoming';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'ongoing':
        return '●';
      default:
        return '○';
    }
  };

  const getStatusClass = (status) => {
    return `routine-item ${status}`;
  };

  const getCurrentDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="jadwal-container">
        <div className="loading">Memuat jadwal...</div>
      </div>
    );
  }

  return (
    <div className="jadwal-container">
      <div className="jadwal-header">
        <h1>Jadwal Hari Ini</h1>
        <p className="date">{getCurrentDate()}</p>
      </div>

      <div className="progress-card">
        <div className="progress-header">
          <span className="progress-title">Progres Hari Ini</span>
          <span className="progress-count">{todayProgress.completed}/{todayProgress.total}</span>
        </div>
        <span className="progress-subtitle">Tetap semangat!!</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${todayProgress.total > 0 ? (todayProgress.completed / todayProgress.total) * 100 : 0}%` 
            }}
          />
        </div>
      </div>

      <div className="routines-list">
        {routines.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada jadwal untuk hari ini</p>
          </div>
        ) : (
          routines.map((routine) => {
            const status = getRoutineStatus(routine);
            return (
              <div key={routine.id} className={getStatusClass(status)}>
                <div className="routine-icon">
                  <span className="status-indicator">{getStatusIcon(status)}</span>
                </div>
                <div className="routine-details">
                  <h3 className="routine-title">{routine.activityName}</h3>
                  <p className="routine-description">{routine.description || 'Tidak ada deskripsi'}</p>
                  <div className="routine-meta">
                    <span className="routine-time">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {formatTime(routine.startTime)}
                    </span>
                    <span className="routine-caregiver">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {routine.createdBy || 'Suster Rina'}
                    </span>
                  </div>
                </div>
                {status === 'completed' && (
                  <div className="status-badge success">Selesai</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Jadwal;
