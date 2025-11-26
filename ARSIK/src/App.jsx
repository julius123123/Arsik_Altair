import { useState } from 'react'
import FaceRecognition from './components/FaceRecognition'
import PeopleList from './components/PeopleList'
import RoutineNotification from './components/RoutineNotification'
import ConversationAssistant from './components/ConversationAssistant'
import LocationTracker from './components/LocationTracker'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('detection')
  const [updateTrigger, setUpdateTrigger] = useState(0)

  return (
    <div className="app">
      {/* Routine notifications overlay */}
      <RoutineNotification />
      
      {/* Location tracking */}
      <LocationTracker patientId="patient_001" />

      <header className="app-header">
        <h1>🧠 Dementia Patient Assistant</h1>
        <p className="subtitle">Helping you remember the faces that matter</p>
      </header>

      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'detection' ? 'active' : ''}`}
          onClick={() => setActiveTab('detection')}
        >
          📹 Face Detection
        </button>
        <button 
          className={`tab ${activeTab === 'people' ? 'active' : ''}`}
          onClick={() => setActiveTab('people')}
        >
          👥 Saved People
        </button>
        <button 
          className={`tab ${activeTab === 'conversation' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          💬 AI Assistant
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'detection' ? (
          <FaceRecognition />
        ) : activeTab === 'people' ? (
          <PeopleList onUpdate={() => setUpdateTrigger(prev => prev + 1)} />
        ) : (
          <ConversationAssistant />
        )}
      </main>

      <footer className="app-footer">
        <p>💡 Tip: {
          activeTab === 'detection' ? 'Point the camera at people you\'re talking to. The app will learn their names automatically.' :
          activeTab === 'people' ? 'View and manage people you\'ve met. Long-press to delete.' :
          'Chat with the AI assistant to get help with names, times, and reminders.'
        }</p>
      </footer>
    </div>
  )
}

export default App
