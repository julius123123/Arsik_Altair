import { useState } from 'react'
import ApprovalDashboard from './components/ApprovalDashboard'
import RoutineManager from './components/RoutineManager'
import FaceUpload from './components/FaceUpload'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('approvals');

  return (
    <div className="app">
      <div className="app-header">
        <h1>🏥 ARSIK Caregiver Dashboard</h1>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'approvals' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('approvals')}
          >
            ✅ Approvals
          </button>
          <button 
            className={activeTab === 'upload' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('upload')}
          >
            📸 Upload Face
          </button>
          <button 
            className={activeTab === 'routines' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('routines')}
          >
            📅 Routines
          </button>
        </div>
      </div>

      <div className="app-content">
        {activeTab === 'approvals' && <ApprovalDashboard />}
        {activeTab === 'upload' && <FaceUpload />}
        {activeTab === 'routines' && <RoutineManager />}
      </div>
    </div>
  )
}

export default App
