import { useState, useEffect } from 'react';
import { getPendingRequests, getRoutines } from '../utils/caregiverApi';
import './Home.css';

const Home = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalRoutines: 0,
    pendingApprovals: 0,
    completionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [pendingResult, routinesResult] = await Promise.all([
        getPendingRequests(),
        getRoutines()
      ]);

      const totalRoutines = routinesResult.success ? routinesResult.routines.length : 0;
      const pendingApprovals = pendingResult.success ? pendingResult.pending.length : 0;
      
      // Calculate completion rate (mock calculation)
      const completionRate = totalRoutines > 0 ? Math.floor((totalRoutines * 0.94)) : 94;

      setStats({
        totalRoutines,
        pendingApprovals,
        completionRate: Math.min(100, completionRate)
      });

      // Mock recent activity
      const activities = [];
      
      if (routinesResult.success && routinesResult.routines.length > 0) {
        const recentRoutine = routinesResult.routines[0];
        activities.push({
          id: 1,
          type: 'routine',
          message: `Routine "${recentRoutine.activityName}" completed`,
          time: '2 hours ago',
          color: '#27ae60'
        });
      }

      if (pendingResult.success && pendingResult.pending.length > 0) {
        activities.push({
          id: 2,
          type: 'upload',
          message: 'New face data uploaded',
          time: '5 hours ago',
          color: '#3498db'
        });
      }

      activities.push({
        id: 3,
        type: 'approval',
        message: 'Approval request received',
        time: '1 day ago',
        color: '#f39c12'
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>ARSIK Suster Portal</h1>
      </div>

      <div className="welcome-section">
        <h2>Selamat Datang Kembali!</h2>
        <p>Berikut Laporan Singkat Hari Ini</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalRoutines}</div>
            <div className="stat-label">Total Routines</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-list">
          <button className="action-button" onClick={() => onNavigate('routines')}>
            View Today's Schedule
          </button>
          <button className="action-button" onClick={() => onNavigate('approvals')}>
            Check Caregiver Status
          </button>
          <button className="action-button" onClick={() => onNavigate('routines')}>
            Review AI Analysis
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-dot" style={{ backgroundColor: activity.color }}></div>
              <div className="activity-content">
                <div className="activity-message">{activity.message}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
