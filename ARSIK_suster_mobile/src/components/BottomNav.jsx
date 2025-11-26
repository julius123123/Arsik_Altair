import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav({ activeTab }) {
  const location = useLocation();
  
  return (
    <nav className="bottom-nav safe-bottom">
      <Link 
        to="/" 
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
      >
        <div className="nav-icon">🏠</div>
        <span>Home</span>
      </Link>

      <Link 
        to="/routine" 
        className={`nav-item ${activeTab === 'routine' ? 'active' : ''}`}
      >
        <div className="nav-icon">📋</div>
        <span>Routine</span>
      </Link>

      <Link 
        to="/add-data" 
        className={`nav-item ${activeTab === 'add-data' ? 'active' : ''}`}
      >
        <div className="nav-icon">➕</div>
        <span>Add</span>
      </Link>

      <Link 
        to="/inbox" 
        className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
      >
        <div className="nav-icon">
          📬
          {activeTab !== 'inbox' && <span className="nav-badge">2</span>}
        </div>
        <span>Inbox</span>
      </Link>

      <Link 
        to="/alerts" 
        className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
      >
        <div className="nav-icon">🚨</div>
        <span>Alerts</span>
      </Link>

      <Link 
        to="/profile" 
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
      >
        <div className="nav-icon">👤</div>
        <span>Profile</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
