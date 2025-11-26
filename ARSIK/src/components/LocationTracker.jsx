import { useEffect, useRef, useState } from 'react';
import './LocationTracker.css';

const LocationTracker = ({ patientId = 'patient_001' }) => {
  const [locationStatus, setLocationStatus] = useState('initializing');
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const watchIdRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setLocationStatus('unsupported');
      return;
    }

    // Start tracking location
    const startTracking = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
      setLocationStatus('tracking');
      console.log('📍 Location tracking started');
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('📍 Location tracking stopped');
      }
    };
  }, [patientId]);

  const handlePositionUpdate = async (position) => {
    const { latitude, longitude } = position.coords;
    
    console.log('📍 Position updated:', { latitude, longitude });

    try {
      // Send position to backend
      const response = await fetch('http://localhost:3001/api/patient-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update status based on distance
        if (data.outOfBounds) {
          setIsOutOfBounds(true);
          setLocationStatus('out-of-bounds');
          
          // Prevent alert spam - only alert once every 5 minutes
          const now = Date.now();
          if (now - lastAlertTimeRef.current > 300000) {
            console.warn('⚠️ Patient is out of bounds!', data.distance, 'km from home');
            lastAlertTimeRef.current = now;
          }
        } else {
          setIsOutOfBounds(false);
          setLocationStatus('tracking');
        }
      }
    } catch (error) {
      console.error('Error sending location:', error);
    }
  };

  const handlePositionError = (error) => {
    console.error('Geolocation error:', error.message);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationStatus('permission-denied');
        break;
      case error.POSITION_UNAVAILABLE:
        setLocationStatus('unavailable');
        break;
      case error.TIMEOUT:
        setLocationStatus('timeout');
        break;
      default:
        setLocationStatus('error');
    }
  };

  return (
    <div className={`location-tracker ${isOutOfBounds ? 'out-of-bounds' : ''}`}>
      <div className="location-indicator">
        {locationStatus === 'tracking' && !isOutOfBounds && (
          <>
            <span className="location-icon">📍</span>
            <span className="location-text">Lokasi Terpantau</span>
          </>
        )}
        {locationStatus === 'tracking' && isOutOfBounds && (
          <>
            <span className="location-icon warning">⚠️</span>
            <span className="location-text warning">Jauh dari Rumah</span>
          </>
        )}
        {locationStatus === 'permission-denied' && (
          <>
            <span className="location-icon">❌</span>
            <span className="location-text">Izin Lokasi Ditolak</span>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;
