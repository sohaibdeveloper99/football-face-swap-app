import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setAuthToken(data.token);
        setIsLoggedIn(true);
        setWelcomeMessage(`Welcome back, ${username}! 🎉 You have successfully logged into the Football Face Swap Admin Panel.`);
        loadDashboardData(data.token);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    }
  };

  const loadDashboardData = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      setError('Failed to load dashboard data');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken('');
    setDashboardData(null);
    setUsername('');
    setPassword('');
    setError('');
    setWelcomeMessage('');
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>⚽ Admin Panel</h1>
          <p>Football Face Swap Management</p>
        </div>

        <div className="admin-body">
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>⚽ Admin Dashboard</h1>
        <p>Football Face Swap Management</p>
      </div>

      <div className="admin-body">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {welcomeMessage && (
          <div className="welcome-message">
            {welcomeMessage}
          </div>
        )}

        {dashboardData && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{dashboardData.totalSwaps}</div>
                <div className="stat-label">Total Swaps</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{dashboardData.todaySwaps}</div>
                <div className="stat-label">Today's Swaps</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{dashboardData.activeUsers}</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{dashboardData.apiCalls}</div>
                <div className="stat-label">API Calls</div>
              </div>
            </div>

            <div className="system-info">
              <h3>System Information</h3>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value status-online">{dashboardData.systemStatus}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Backup:</span>
                <span className="info-value">{dashboardData.lastBackup}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Storage Used:</span>
                <span className="info-value">{dashboardData.storageUsed}</span>
              </div>
            </div>
          </>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminPanel;
