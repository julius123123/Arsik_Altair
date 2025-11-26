import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './Home.css';

function Home() {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Welcome */}
        <div className="welcome-section">
          <h2>Selamat Datang Kembali!</h2>
          <p className="subtitle">Berikut Laporan Singkat Hari Ini</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon success">✓</div>
            <div className="stat-value">12</div>
            <div className="stat-label">Total Routines</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">⚠</div>
            <div className="stat-value">2</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary">📊</div>
            <div className="stat-value">94%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-list">
            <Link to="/routine" className="action-item">
              <span>View Today's Schedule</span>
              <span className="arrow">›</span>
            </Link>
            <div className="action-item">
              <span>Check Caregiver Status</span>
              <span className="arrow">›</span>
            </div>
            <div className="action-item">
              <span>Review AI Analysis</span>
              <span className="arrow">›</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot success"></div>
              <div className="activity-content">
                <div className="activity-title">Routine "Minum Obat Pagi" completed</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot primary"></div>
              <div className="activity-content">
                <div className="activity-title">New face data uploaded</div>
                <div className="activity-time">5 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot warning"></div>
              <div className="activity-content">
                <div className="activity-title">Approval request sent</div>
                <div className="activity-time">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" />
    </div>
  );
}

export default Home;
