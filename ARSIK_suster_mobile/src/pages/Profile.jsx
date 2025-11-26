import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [patientId] = useState('patient_001'); // Default patient ID
  const [patientProfile, setPatientProfile] = useState({
    name: '',
    age: '',
    familyMembers: '',
    interests: '',
    commonQuestions: ''
  });
  const [saveStatus, setSaveStatus] = useState('');

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  useEffect(() => {
    if (patientId) {
      loadProfile();
    }
  }, [patientId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/patient-profile/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setPatientProfile({
            name: data.profile.name || '',
            age: data.profile.age || '',
            familyMembers: Array.isArray(data.profile.familyMembers) 
              ? data.profile.familyMembers.join(', ') 
              : data.profile.familyMembers || '',
            interests: Array.isArray(data.profile.interests)
              ? data.profile.interests.join(', ')
              : data.profile.interests || '',
            commonQuestions: Array.isArray(data.profile.commonQuestions)
              ? data.profile.commonQuestions.join(', ')
              : data.profile.commonQuestions || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!patientProfile.name) {
      alert('Mohon masukkan nama pasien');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/patient-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          profile: {
            name: patientProfile.name,
            age: patientProfile.age,
            familyMembers: patientProfile.familyMembers
              .split(',')
              .map(s => s.trim())
              .filter(s => s),
            interests: patientProfile.interests
              .split(',')
              .map(s => s.trim())
              .filter(s => s),
            commonQuestions: patientProfile.commonQuestions
              .split(',')
              .map(s => s.trim())
              .filter(s => s)
          }
        })
      });

      if (response.ok) {
        setSaveStatus('✅ Profil berhasil disimpan!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Gagal menyimpan');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('❌ Terjadi kesalahan');
    }
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <div className="profile-header">
          <div>
            <h2 className="page-title">👤 Profil Pasien</h2>
            <p className="subtitle">Informasi untuk AI Assistant</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="btn btn-secondary btn-icon"
          >
            ⚙️
          </button>
        </div>

        {saveStatus && (
          <div className={`alert ${saveStatus.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {saveStatus}
          </div>
        )}

        <form className="profile-form">
          <div className="form-group">
            <label className="form-label">Nama Pasien</label>
            <input
              type="text"
              className="input"
              value={patientProfile.name}
              onChange={(e) => setPatientProfile({ ...patientProfile, name: e.target.value })}
              placeholder="Contoh: Ibu Siti"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Usia</label>
            <input
              type="number"
              className="input"
              value={patientProfile.age}
              onChange={(e) => setPatientProfile({ ...patientProfile, age: e.target.value })}
              placeholder="Contoh: 75"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anggota Keluarga</label>
            <input
              type="text"
              className="input"
              value={patientProfile.familyMembers}
              onChange={(e) => setPatientProfile({ ...patientProfile, familyMembers: e.target.value })}
              placeholder="Contoh: Budi (anak), Maria (cucu)"
            />
            <small className="form-hint">Pisahkan dengan koma</small>
          </div>

          <div className="form-group">
            <label className="form-label">Minat & Hobi</label>
            <input
              type="text"
              className="input"
              value={patientProfile.interests}
              onChange={(e) => setPatientProfile({ ...patientProfile, interests: e.target.value })}
              placeholder="Contoh: memasak, berkebun"
            />
            <small className="form-hint">Pisahkan dengan koma</small>
          </div>

          <div className="form-group">
            <label className="form-label">Pertanyaan Umum</label>
            <textarea
              className="input"
              value={patientProfile.commonQuestions}
              onChange={(e) => setPatientProfile({ ...patientProfile, commonQuestions: e.target.value })}
              placeholder="Contoh: Jam berapa?, Siapa nama cucu saya?"
              rows={3}
            />
            <small className="form-hint">Pisahkan dengan koma</small>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="btn btn-primary btn-block"
          >
            💾 Simpan Profil
          </button>
        </form>

        <div className="info-box">
          <h4>💡 Informasi:</h4>
          <ul>
            <li>Profil digunakan AI untuk respons yang personal</li>
            <li>AI akan mengingat anggota keluarga pasien</li>
            <li>Minat & hobi untuk saran aktivitas</li>
          </ul>
        </div>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}

export default Profile;
