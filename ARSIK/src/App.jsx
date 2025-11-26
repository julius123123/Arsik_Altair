import { useState, useEffect } from 'react'
import FaceRecognition from './components/FaceRecognition'
import PeopleList from './components/PeopleList'
import RoutineNotification from './components/RoutineNotification'
import ConversationAssistant from './components/ConversationAssistant'
import LocationTracker from './components/LocationTracker'
import Jadwal from './components/Jadwal'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('detection')
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [patientName, setPatientName] = useState('Patient')

  // Load patient profile from localStorage
  useEffect(() => {
    const profile = localStorage.getItem('arsik_patient_profile')
    if (profile) {
      try {
        const data = JSON.parse(profile)
        setPatientName(data.name || 'Patient')
      } catch (error) {
        console.error('Error loading patient profile:', error)
      }
    }
  }, [])

  return (
    <div className="app-container">
      {/* Routine notifications overlay */}
      <RoutineNotification />
      
      {/* Location tracking */}
      <LocationTracker patientId="patient_001" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-greeting">User Greeting</div>
          <div className="portal-badge">
            <span className="portal-title">ARSIK Patient</span>
            <span className="portal-subtitle">Portal Pasien</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor"/>
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <span className="user-name">{patientName}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Home</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'jadwal' ? 'active' : ''}`}
            onClick={() => setActiveTab('jadwal')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Jadwal</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'detection' ? 'active' : ''}`}
            onClick={() => setActiveTab('detection')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v3m0 16v3M21 12h-3M6 12H3m15.36-7.36l-2.12 2.12M7.76 16.24l-2.12 2.12m12.72 0l-2.12-2.12M7.76 7.76L5.64 5.64" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Siapa Ini?</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="clock">14:30</div>
          <div className="date">Rabu, 26 November 2025</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <button className="settings-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9.5 3h5l.5 2.5 2 1 2.5-.5 2.5 4.33-2 2 0 2 2 2-2.5 4.33-2.5-.5-2 1-.5 2.5h-5l-.5-2.5-2-1-2.5.5-2.5-4.33 2-2 0-2-2-2L5.5 6.5l2.5.5 2-1L9.5 3z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {activeTab === 'detection' ? (
          <FaceRecognition />
        ) : activeTab === 'jadwal' ? (
          <Jadwal />
        ) : (
          <div className="content-placeholder">
            <h2>Content for {activeTab}</h2>
          </div>
        )}
      </main>

      {/* Floating AI Assistant Button */}
      <button 
        className="ai-assistant-fab"
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        title="AI Assistant"
      >
        💬
      </button>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="ai-assistant-modal">
          <div className="ai-assistant-modal-header">
            <h2>AI Assistant</h2>
            <button 
              className="close-modal"
              onClick={() => setShowAIAssistant(false)}
            >
              ✕
            </button>
          </div>
          <ConversationAssistant />
        </div>
      )}
    </div>
  )
}

export default App
