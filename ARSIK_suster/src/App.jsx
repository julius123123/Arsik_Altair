import { useState, useEffect } from 'react'
import Home from './components/Home'
import ApprovalDashboard from './components/ApprovalDashboard'
import RoutineManager from './components/RoutineManager'
import FaceUpload from './components/FaceUpload'
import AIConfiguration from './components/AIConfiguration'
import { getPendingRequests } from './utils/caregiverApi'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [pendingCount, setPendingCount] = useState(0);
  const [patientId, setPatientId] = useState('');

  // Check for pending approvals for badge
  useEffect(() => {
    const checkPending = async () => {
      const result = await getPendingRequests();
      if (result.success) {
        setPendingCount(result.pending.length);
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="app">
      <div className="app-content">
        {activeTab === 'home' && <Home onNavigate={handleNavigate} />}
        {activeTab === 'routines' && <RoutineManager />}
        {activeTab === 'upload' && <FaceUpload />}
        {activeTab === 'approvals' && <ApprovalDashboard />}
        {activeTab === 'ai-config' && (
          <AIConfiguration patientId={patientId} />
        )}
        {activeTab === 'profile' && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Profile</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Patient ID (untuk konfigurasi AI):
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Masukkan Patient ID"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '300px'
                }}
              />
            </div>
            <button
              onClick={() => setActiveTab('ai-config')}
              disabled={!patientId}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: patientId ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: patientId ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              🤖 Konfigurasi AI Assistant
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <div className="nav-icon">🏠</div>
          <div className="nav-label">Home</div>
        </button>

        <button
          className={`nav-item ${activeTab === 'routines' ? 'active' : ''}`}
          onClick={() => setActiveTab('routines')}
        >
          <div className="nav-icon">📅</div>
          <div className="nav-label">Routine</div>
        </button>

        <button
          className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <div className="nav-icon add-icon">+</div>
          <div className="nav-label">Add Data</div>
        </button>

        <button
          className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <div className="nav-icon">
            📥
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </div>
          <div className="nav-label">Inbox</div>
        </button>

        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="nav-icon">👤</div>
          <div className="nav-label">Profile</div>
        </button>
      </div>
    </div>
  )
}

export default App
