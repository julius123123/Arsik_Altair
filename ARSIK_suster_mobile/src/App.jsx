import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Routine from './pages/Routine';
import RoutineAdd from './pages/RoutineAdd';
import AddData from './pages/AddData';
import Inbox from './pages/Inbox';
import Profile from './pages/Profile';
import LocationAlerts from './pages/LocationAlerts';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/routine" element={<Routine />} />
          <Route path="/routine/add" element={<RoutineAdd />} />
          <Route path="/add-data" element={<AddData />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/alerts" element={<LocationAlerts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
