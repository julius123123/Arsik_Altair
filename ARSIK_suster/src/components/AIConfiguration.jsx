import React, { useState, useEffect } from 'react';

function AIConfiguration({ patientId }) {
  const [patientProfile, setPatientProfile] = useState({
    name: '',
    age: '',
    familyMembers: '',
    interests: '',
    commonQuestions: ''
  });
  const [saveStatus, setSaveStatus] = useState('');

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
          setSaveStatus('✅ Profil berhasil dimuat');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setSaveStatus('❌ Gagal memuat profil');
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
        setSaveStatus('✅ Profil pasien berhasil disimpan!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Gagal menyimpan profil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('❌ Terjadi kesalahan');
    }
  };

  const handleClearProfile = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data profil?')) {
      setPatientProfile({
        name: '',
        age: '',
        familyMembers: '',
        interests: '',
        commonQuestions: ''
      });
      setSaveStatus('🗑️ Profil dikosongkan');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <h2 style={{ marginBottom: '8px', color: '#333' }}>
        👤 Profil Pasien
      </h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Informasi ini akan digunakan oleh AI Assistant untuk memberikan respons yang lebih personal dan relevan kepada pasien.
      </p>

      {saveStatus && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: saveStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${saveStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: saveStatus.includes('✅') ? '#155724' : '#721c24',
          fontWeight: 'bold'
        }}>
          {saveStatus}
        </div>
      )}
      {/* Patient Profile Form */}
      <div style={{ marginBottom: '24px' }}>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
            Nama Pasien
          </label>
          <input
            type="text"
            value={patientProfile.name}
            onChange={(e) => setPatientProfile({ ...patientProfile, name: e.target.value })}
            placeholder="Contoh: Ibu Siti"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
            Usia
          </label>
          <input
            type="number"
            value={patientProfile.age}
            onChange={(e) => setPatientProfile({ ...patientProfile, age: e.target.value })}
            placeholder="Contoh: 75"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
            Anggota Keluarga (pisahkan dengan koma)
          </label>
          <input
            type="text"
            value={patientProfile.familyMembers}
            onChange={(e) => setPatientProfile({ ...patientProfile, familyMembers: e.target.value })}
            placeholder="Contoh: Budi (anak), Maria (cucu), Ahmad (suami)"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            💡 AI akan mengingat dan menyebutkan anggota keluarga saat berbicara dengan pasien
          </small>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
            Minat & Hobi (pisahkan dengan koma)
          </label>
          <input
            type="text"
            value={patientProfile.interests}
            onChange={(e) => setPatientProfile({ ...patientProfile, interests: e.target.value })}
            placeholder="Contoh: memasak, berkebun, mendengarkan musik"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '0' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
            Pertanyaan yang Sering Diajukan (pisahkan dengan koma)
          </label>
          <textarea
            value={patientProfile.commonQuestions}
            onChange={(e) => setPatientProfile({ ...patientProfile, commonQuestions: e.target.value })}
            placeholder="Contoh: Jam berapa sekarang?, Siapa nama cucu saya?, Kapan makan siang?"
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSaveProfile}
          disabled={!patientId}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: patientId ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: patientId ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          💾 Simpan Profil
        </button>
        
        <button
          onClick={handleClearProfile}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Kosongkan
        </button>
      </div>

      {/* Info Section */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '8px' }}>💡 Informasi:</h4>
        <ul style={{ marginBottom: '0', paddingLeft: '20px', fontSize: '14px' }}>
          <li>Profil pasien akan digunakan oleh AI Assistant untuk memberikan respons yang lebih personal</li>
          <li>Semakin lengkap informasi yang diberikan, semakin baik AI dapat membantu pasien</li>
          <li>AI akan mengingat anggota keluarga dan dapat menyebutkan mereka dalam percakapan</li>
          <li>Minat & hobi akan digunakan untuk menyarankan aktivitas yang sesuai</li>
          <li>Pertanyaan umum membantu AI mengenali pola pertanyaan yang sering diulang</li>
        </ul>
      </div>
    </div>
  );
}

export default AIConfiguration;
