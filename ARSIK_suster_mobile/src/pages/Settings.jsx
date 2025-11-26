import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import './Settings.css';

function Settings() {
  const [patientId] = useState('patient_001');
  const [homeLocation, setHomeLocation] = useState({
    latitude: '',
    longitude: '',
    radius: '2.0'
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung browser ini');
      return;
    }

    setIsGettingLocation(true);
    setSaveStatus('📍 Mengambil lokasi saat ini...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setHomeLocation({
          ...homeLocation,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        });
        setCurrentLocation({ latitude, longitude });
        setSaveStatus('✅ Lokasi berhasil diambil!');
        setIsGettingLocation(false);
        
        setTimeout(() => setSaveStatus(''), 3000);
      },
      (error) => {
        console.error('Error getting location:', error);
        setSaveStatus('❌ Gagal mengambil lokasi');
        setIsGettingLocation(false);
        
        setTimeout(() => setSaveStatus(''), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSave = async () => {
    if (!homeLocation.latitude || !homeLocation.longitude) {
      alert('Mohon masukkan koordinat atau gunakan lokasi saat ini');
      return;
    }

    const lat = parseFloat(homeLocation.latitude);
    const lon = parseFloat(homeLocation.longitude);
    const rad = parseFloat(homeLocation.radius);

    if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
      alert('Koordinat atau radius tidak valid');
      return;
    }

    if (rad <= 0 || rad > 10) {
      alert('Radius harus antara 0.1 - 10 km');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/home-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          latitude: lat,
          longitude: lon,
          radius: rad
        })
      });

      if (response.ok) {
        setSaveStatus('✅ Lokasi rumah berhasil disimpan!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Gagal menyimpan');
      }
    } catch (error) {
      console.error('Error saving home location:', error);
      setSaveStatus('❌ Terjadi kesalahan');
    }
  };

  const openInMaps = () => {
    if (homeLocation.latitude && homeLocation.longitude) {
      window.open(`https://www.google.com/maps?q=${homeLocation.latitude},${homeLocation.longitude}`, '_blank');
    }
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <h2 className="page-title">⚙️ Settings</h2>
        <p className="subtitle">Konfigurasi lokasi rumah (checkpoint)</p>

        {saveStatus && (
          <div className={`alert ${saveStatus.includes('✅') ? 'alert-success' : saveStatus.includes('📍') ? 'alert-info' : 'alert-error'}`}>
            {saveStatus}
          </div>
        )}

        <div className="settings-section">
          <h3 className="section-title">📍 Lokasi Rumah</h3>
          <p className="section-description">
            Tentukan lokasi rumah sebagai titik referensi. Sistem akan memberi alert jika pasien keluar dari radius yang ditentukan.
          </p>

          <form className="settings-form">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                type="text"
                className="input"
                value={homeLocation.latitude}
                onChange={(e) => setHomeLocation({ ...homeLocation, latitude: e.target.value })}
                placeholder="Contoh: -6.200000"
                disabled={isGettingLocation}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                type="text"
                className="input"
                value={homeLocation.longitude}
                onChange={(e) => setHomeLocation({ ...homeLocation, longitude: e.target.value })}
                placeholder="Contoh: 106.816666"
                disabled={isGettingLocation}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Radius Alert (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                className="input"
                value={homeLocation.radius}
                onChange={(e) => setHomeLocation({ ...homeLocation, radius: e.target.value })}
                placeholder="2.0"
                disabled={isGettingLocation}
              />
              <small className="form-hint">Jarak maksimal dari rumah sebelum alert (0.1 - 10 km)</small>
            </div>

            <div className="button-group">
              <button
                type="button"
                onClick={useCurrentLocation}
                className="btn btn-secondary"
                disabled={isGettingLocation}
              >
                {isGettingLocation ? '⏳ Mengambil...' : '📍 Gunakan Lokasi Saat Ini'}
              </button>
              
              {homeLocation.latitude && homeLocation.longitude && (
                <button
                  type="button"
                  onClick={openInMaps}
                  className="btn btn-secondary"
                >
                  🗺️ Lihat di Maps
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-block"
              disabled={!homeLocation.latitude || !homeLocation.longitude || isGettingLocation}
            >
              💾 Simpan Lokasi Rumah
            </button>
          </form>
        </div>

        <div className="info-box" style={{ marginBottom: '100px' }}>
          <h4>💡 Cara Menggunakan:</h4>
          <ul>
            <li><strong>Opsi 1:</strong> Klik "Gunakan Lokasi Saat Ini" jika Anda berada di rumah pasien</li>
            <li><strong>Opsi 2:</strong> Masukkan koordinat manual (dapat dari Google Maps)</li>
            <li>Setelah tersimpan, sistem akan otomatis membuat alert jika pasien keluar dari radius</li>
            <li>Default radius adalah 2 km, dapat disesuaikan sesuai kebutuhan</li>
          </ul>
        </div>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}

export default Settings;
