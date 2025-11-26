import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import './LocationAlerts.css';

function LocationAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  useEffect(() => {
    loadAlerts();
    
    // Poll for new alerts every 10 seconds
    const interval = setInterval(loadAlerts, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/location-alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/location-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Remove from list
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const openMaps = (latitude, longitude) => {
    // Open in Google Maps
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    
    return date.toLocaleString('id-ID', { 
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <h2 className="page-title">🚨 Location Alerts</h2>
        <p className="subtitle">Pasien keluar dari area rumah (&gt;2km)</p>

        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Memuat alert...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <h3>Semua Aman</h3>
            <p>Tidak ada alert lokasi saat ini</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className="alert-card">
                <div className="alert-header">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-info">
                    <h3>Pasien Jauh dari Rumah</h3>
                    <p className="alert-time">{formatTime(alert.timestamp)}</p>
                  </div>
                </div>

                <div className="alert-details">
                  <div className="detail-row">
                    <span className="detail-label">Jarak:</span>
                    <span className="detail-value">{alert.distance} km dari rumah</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Koordinat:</span>
                    <span className="detail-value">
                      {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>

                <div className="alert-actions">
                  <button
                    onClick={() => openMaps(alert.latitude, alert.longitude)}
                    className="btn btn-secondary btn-small"
                  >
                    🗺️ Lihat di Maps
                  </button>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="btn btn-primary btn-small"
                  >
                    ✓ Tandai Selesai
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="alerts" />
    </div>
  );
}

export default LocationAlerts;
