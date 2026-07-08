import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TriangleAlert, 
  Clock, 
  Settings, 
  CheckCircle, 
  Plus, 
  List, 
  Map as MapIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
          navigate('/admin-dashboard');
          return;
        }
      } catch (err) {
        console.error('Error parsing user data', err);
      }
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Check if user is logged in
        if (!token) {
          setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
          setRecentIssues([]);
          setLoading(false);
          return;
        }

        // Fetch user's issues for stats
        const issuesResponse = await fetch('http://localhost:5000/api/issues/my-issues', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const issuesData = await issuesResponse.json();
        
        if (!issuesResponse.ok) {
          throw new Error(issuesData.message || 'Failed to fetch issues');
        }

        const issues = issuesData.issues;

        // Calculate statistics
        const total = issues.length;
        const pending = issues.filter(issue => issue.status === 'pending').length;
        const inProgress = issues.filter(issue => issue.status === 'in-progress').length;
        const resolved = issues.filter(issue => issue.status === 'resolved').length;

        setStats({ total, pending, inProgress, resolved });

        // Get recent 5 issues
        setRecentIssues(issues.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Set default values on error
        setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
        setRecentIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format relative time
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  // Get status display text
  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Received';
      case 'in-progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={48} />
            <p style={{ marginTop: '1rem' }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Dashboard</h1>
      
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper text-gray">
            <TriangleAlert size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.total}</h2>
          <p className="metric-label">Total Issues</p>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper text-blue">
            <Clock size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.pending}</h2>
          <p className="metric-label">Pending</p>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper text-dark">
            <Settings size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.inProgress}</h2>
          <p className="metric-label">In Progress</p>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper text-dark">
            <CheckCircle size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.resolved}</h2>
          <p className="metric-label">Resolved</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        
        {/* Left Column: Recent Activity */}
        <div className="content-panel activity-panel">
          <h3 className="panel-title">Recent Activity</h3>
          <div className="panel-card p-0">
            {recentIssues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No issues reported yet</p>
                <Link to="/report" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  <Plus size={16} />
                  <span>Report First Issue</span>
                </Link>
              </div>
            ) : (
              <ul className="activity-list">
                {recentIssues.map((issue, index) => (
                  <li key={issue._id} className="activity-item">
                    <div className={`activity-icon ${issue.status === 'resolved' ? 'bg-green' : issue.status === 'in-progress' ? 'bg-yellow' : 'bg-light-gray'}`}>
                      {issue.status === 'resolved' ? (
                        <CheckCircle size={16} color="white" />
                      ) : issue.status === 'in-progress' ? (
                        <Settings size={16} color="white" />
                      ) : (
                        <Plus size={16} color="white" />
                      )}
                    </div>
                    <div className="activity-details">
                      <p className="activity-text">{issue.title}</p>
                      <span className="activity-time">
                        {getRelativeTime(issue.createdAt)} • {getStatusText(issue.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="content-panel actions-panel">
          <h3 className="panel-title">Quick Actions</h3>
          <div className="actions-stack">
            <Link to="/report" className="btn btn-primary btn-block btn-action">
              <Plus size={18} />
              <span>Report New Issue</span>
            </Link>
            
            <Link to="/complaints" className="btn btn-outline btn-block btn-action">
              <List size={18} />
              <span>View All Complaints</span>
            </Link>
            
            <button className="btn btn-outline btn-block btn-action">
              <MapIcon size={18} />
              <span>Issue Map</span>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
