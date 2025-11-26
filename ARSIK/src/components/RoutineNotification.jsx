import { useState, useEffect, useRef } from 'react';
import { getPendingRoutines } from '../utils/apiClient';
import { getTTSService } from '../utils/textToSpeech';
import './RoutineNotification.css';

const RoutineNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const ttsService = useRef(null);
  const checkInterval = useRef(null);

  useEffect(() => {
    ttsService.current = getTTSService();
    
    // Check for pending routines every 30 seconds
    checkPendingRoutines();
    checkInterval.current = setInterval(checkPendingRoutines, 30000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, []);

  const checkPendingRoutines = async () => {
    const result = await getPendingRoutines();
    if (result.success && result.routines && result.routines.length > 0) {
      const newRoutines = result.routines.filter(r => !dismissed.has(r.id));
      
      if (newRoutines.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const toAdd = newRoutines.filter(r => !existingIds.has(r.id));
          return [...prev, ...toAdd];
        });

        // Announce each new routine via TTS
        newRoutines.forEach(routine => {
          announceRoutine(routine);
        });
      }
    }
  };

  const announceRoutine = (routine) => {
    if (ttsService.current) {
      // Play bell sound first
      ttsService.current.playBellSound();
      
      // Then speak the message after a short delay
      setTimeout(() => {
        const message = `Pengingat: Waktu untuk ${routine.activityName}`;
        ttsService.current.speak(message, {
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0
        });
        console.log('Announced routine:', message);
      }, 600); // Wait for bell to finish
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDismissed(prev => new Set([...prev, id]));
  };

  const dismissAll = () => {
    notifications.forEach(n => {
      setDismissed(prev => new Set([...prev, n.id]));
    });
    setNotifications([]);
  };

  const formatTime = (routine) => {
    // Handle time range with startTime and endTime
    if (routine.startTime && routine.endTime) {
      return `${routine.startTime} - ${routine.endTime}`;
    }
    if (routine.startTime) {
      return routine.startTime;
    }
    // Fallback to dateTime for backward compatibility
    if (routine.dateTime) {
      const date = new Date(routine.dateTime);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Sekarang';
  };

  const calculateProgress = (routine) => {
    if (!routine.startTime || !routine.endTime) return 0;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = routine.startTime.split(':').map(Number);
    const [endHour, endMin] = routine.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (currentMinutes < startMinutes) return 0;
    if (currentMinutes > endMinutes) return 100;
    
    const totalDuration = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="routine-notifications">
      <div className="notification-header">
        <h3>⏰ Pengingat Aktivitas</h3>
        <button onClick={dismissAll} className="btn-dismiss-all">
          Tutup Semua
        </button>
      </div>
      
      <div className="notifications-list">
        {notifications.map(routine => {
          const progress = calculateProgress(routine);
          const circumference = 2 * Math.PI * 18; // radius = 18
          const offset = circumference - (progress / 100) * circumference;
          
          return (
            <div key={routine.id} className="notification-card">
              <div className="timer-container">
                <svg className="timer-circle" width="50" height="50" viewBox="0 0 44 44">
                  <circle
                    className="timer-background"
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#ecf0f1"
                    strokeWidth="4"
                  />
                  <circle
                    className="timer-progress"
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#e74c3c"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 22 22)"
                  />
                </svg>
                <div className="timer-icon">⏰</div>
              </div>
              <div className="notification-content">
                <h4>{routine.activityName}</h4>
                <p className="notification-time">
                  Waktu: {formatTime(routine)}
                </p>
                {routine.isRecurring && (
                  <span className="badge-recurring">🔄 {routine.frequency}</span>
                )}
              </div>
              <button
                onClick={() => dismissNotification(routine.id)}
                className="btn-dismiss"
                title="Tutup"
              >
                ✓
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoutineNotification;
