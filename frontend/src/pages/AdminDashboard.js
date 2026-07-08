import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  Clock, 
  Settings, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  Loader2,
  Eye,
  Filter
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    totalUsers: 0,
    totalVotes: 0,
    totalComments: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [viewingComments, setViewingComments] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [updatingComment, setUpdatingComment] = useState(false);

  useEffect(() => {
    checkAdminAuth();
    fetchDashboardData();
  }, []);

  const checkAdminAuth = () => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
    } catch (err) {
      navigate('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all issues
      const issuesResponse = await fetch('http://localhost:5000/api/issues?limit=1000', {
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
      const rejected = issues.filter(issue => issue.status === 'rejected').length;
      
      const totalVotes = issues.reduce((sum, issue) => 
        sum + (issue.votes?.upvotes?.length || 0) + (issue.votes?.downvotes?.length || 0), 0
      );
      
      const totalComments = issues.reduce((sum, issue) => 
        sum + (issue.comments?.length || 0), 0
      );

      setStats({ 
        total, 
        pending, 
        inProgress, 
        resolved, 
        rejected,
        totalUsers: 0, // Will be implemented when user management is added
        totalVotes,
        totalComments
      });

      setComplaints(issues);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh data
      await fetchDashboardData();
      setSelectedComplaint(null);
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleReplySubmit = async (issueId, parentCommentId = null) => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      setSubmittingReply(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: replyText,
          parentCommentId: parentCommentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      // Refresh data
      await fetchDashboardData();
      setReplyText('');
      setReplyingToComment(null);
      alert('Reply added successfully!');
    } catch (err) {
      console.error('Error adding reply:', err);
      alert('Failed to add reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditComment = async (issueId, commentId) => {
    if (!editText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setUpdatingComment(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: editText })
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      // Refresh all dashboard data
      await fetchDashboardData();
      
      // Update the viewingComments state with fresh data
      const updatedIssue = await response.json();
      setViewingComments(updatedIssue);
      
      setEditingComment(null);
      setEditText('');
      alert('Comment updated successfully!');
    } catch (err) {
      console.error('Error editing comment:', err);
      alert('Failed to edit comment');
    } finally {
      setUpdatingComment(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const config = {
      'pending': { bg: '#dbeafe', color: '#1e40af', text: 'Pending' },
      'in-progress': { bg: '#fef3c7', color: '#92400e', text: 'In Progress' },
      'resolved': { bg: '#dcfce7', color: '#166534', text: 'Resolved' },
      'rejected': { bg: '#fee2e2', color: '#991b1b', text: 'Rejected' }
    };
    
    const { bg, color, text } = config[status] || config['pending'];
    
    return (
      <span style={{
        backgroundColor: bg,
        color: color,
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600
      }}>
        {text}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'pothole': return <AlertCircle size={20} color="#6b21a8" />;
      case 'streetlight': return <Settings size={20} color="#d97706" />;
      case 'garbage': return <XCircle size={20} color="#64748b" />;
      case 'water': return <TrendingUp size={20} color="#0284c7" />;
      default: return <AlertCircle size={20} color="#64748b" />;
    }
  };

  const filteredComplaints = filterStatus === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} />
          <p style={{ marginTop: '1rem' }}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Admin Dashboard</h1>
      
      {/* Statistics Grid */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2.5rem' }}>
        <div className="metric-card">
          <div className="metric-icon-wrapper text-blue">
            <AlertCircle size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.total}</h2>
          <p className="metric-label">Total Complaints</p>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ color: '#eab308' }}>
            <Clock size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.pending}</h2>
          <p className="metric-label">Pending</p>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper text-green">
            <CheckCircle size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.resolved}</h2>
          <p className="metric-label">Resolved</p>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ color: '#ef4444' }}>
            <XCircle size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.rejected}</h2>
          <p className="metric-label">Rejected</p>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2.5rem' }}>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ color: '#8b5cf6' }}>
            <ThumbsUp size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.totalVotes}</h2>
          <p className="metric-label">Total Votes</p>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ color: '#ec4899' }}>
            <MessageSquare size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.totalComments}</h2>
          <p className="metric-label">Total Comments</p>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ color: '#06b6d4' }}>
            <Users size={32} strokeWidth={1.5} />
          </div>
          <h2 className="metric-value">{stats.inProgress}</h2>
          <p className="metric-label">In Progress</p>
        </div>
      </div>

      {/* Complaints Management Section */}
      <div className="panel-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="panel-title" style={{ marginBottom: 0 }}>All Complaints</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="#64748b" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Issue</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Photo</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Type</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Votes</th>
                <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Comments</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Reported By</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Time</th>
                <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No complaints found
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{complaint.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {complaint.address?.substring(0, 30)}...
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {complaint.photo ? (
                        <img 
                          src={complaint.photo} 
                          alt={complaint.title}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1px solid #e2e8f0'
                          }}
                          onClick={() => setSelectedComplaint(complaint)}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: '0.7rem'
                        }}>
                          No Photo
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getTypeIcon(complaint.type)}
                        <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{complaint.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(complaint.status)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ThumbsUp size={14} color="#22c55e" />
                        <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>
                          {complaint.votes?.upvotes?.length || 0}
                        </span>
                        <ThumbsUp size={14} color="#ef4444" style={{ transform: 'rotate(180deg)' }} />
                        <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                          {complaint.votes?.downvotes?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => setViewingComments(complaint)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <MessageSquare size={14} />
                        <span style={{ marginLeft: '0.25rem' }}>
                          {complaint.comments?.length || 0}
                        </span>
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>{complaint.reportedBy?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{complaint.reportedBy?.email}</div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                      {getRelativeTime(complaint.createdAt)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => setSelectedComplaint(complaint)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} />
                        <span style={{ marginLeft: '0.25rem' }}>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Modal */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedComplaint(null)}>
          <div 
            className="panel-card"
            style={{ 
              maxWidth: '600px', 
              width: '90%', 
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Manage Complaint</h3>
            
            {selectedComplaint.photo && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Photo Evidence</div>
                <img 
                  src={selectedComplaint.photo} 
                  alt={selectedComplaint.title}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }}
                />
              </div>
            )}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>{selectedComplaint.title}</h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {selectedComplaint.description}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Status</div>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Type</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedComplaint.type}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Address</div>
              <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{selectedComplaint.address}</div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Reported By</div>
              <div style={{ fontSize: '0.9rem' }}>
                {selectedComplaint.reportedBy?.name} ({selectedComplaint.reportedBy?.email})
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Update Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleStatusUpdate(selectedComplaint._id, 'pending')}
                  disabled={updating || selectedComplaint.status === 'pending'}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Clock size={14} />
                  <span style={{ marginLeft: '0.25rem' }}>Pending</span>
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedComplaint._id, 'in-progress')}
                  disabled={updating || selectedComplaint.status === 'in-progress'}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem', backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
                >
                  <Settings size={14} />
                  <span style={{ marginLeft: '0.25rem' }}>In Progress</span>
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedComplaint._id, 'resolved')}
                  disabled={updating || selectedComplaint.status === 'resolved'}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem', backgroundColor: '#dcfce7', borderColor: '#22c55e' }}
                >
                  <CheckCircle size={14} />
                  <span style={{ marginLeft: '0.25rem' }}>Resolved</span>
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedComplaint._id, 'rejected')}
                  disabled={updating || selectedComplaint.status === 'rejected'}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem', backgroundColor: '#fee2e2', borderColor: '#ef4444' }}
                >
                  <XCircle size={14} />
                  <span style={{ marginLeft: '0.25rem' }}>Rejected</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSelectedComplaint(null)}
              className="btn btn-primary btn-block"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {viewingComments && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => { setViewingComments(null); setReplyText(''); }}>
          <div 
            className="panel-card"
            style={{ 
              maxWidth: '700px', 
              width: '90%', 
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: 0 }}>Comments & Replies</h3>
              <button 
                onClick={() => { setViewingComments(null); setReplyText(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>{viewingComments.title}</h4>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Reported by {viewingComments.reportedBy?.name} • {getRelativeTime(viewingComments.createdAt)}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                All Comments ({viewingComments.comments?.length || 0})
              </div>

              {viewingComments.comments && viewingComments.comments.length > 0 ? (
                <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                  {/* Show only top-level comments (no parent) */}
                  {viewingComments.comments
                    .filter(comment => !comment.parentComment)
                    .map((comment) => {
                      // Find replies to this comment
                      const replies = viewingComments.comments.filter(
                        c => c.parentComment?.toString() === comment._id.toString()
                      );

                      return (
                        <div key={comment._id} style={{ marginBottom: '1.5rem' }}>
                          {/* Main Comment */}
                          <div 
                            style={{
                              padding: '1rem',
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {comment.user?.profilePhoto ? (
                                  <img 
                                    src={comment.user.profilePhoto} 
                                    alt={comment.user?.name || 'User'}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '1px solid #e2e8f0'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: '#dbeafe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#007bff'
                                  }}>
                                    {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                    {comment.user?.name || comment.user?.username || 'Unknown User'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {getRelativeTime(comment.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setReplyingToComment(replyingToComment === comment._id ? null : comment._id)}
                                style={{
                                  background: replyingToComment === comment._id ? '#007bff' : '#f8fafc',
                                  color: replyingToComment === comment._id ? '#ffffff' : '#007bff',
                                  border: '1px solid #007bff',
                                  borderRadius: '6px',
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <MessageSquare size={12} />
                                <span>Reply</span>
                              </button>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, margin: '0.75rem 0' }}>
                              {comment.text}
                            </p>

                            {/* Reply Input for this specific comment */}
                            {replyingToComment === comment._id && (
                              <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px',
                                borderTop: '2px solid #007bff'
                              }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#007bff', marginBottom: '0.5rem' }}>
                                  Replying to {comment.user?.name || comment.user?.username || 'User'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleReplySubmit(viewingComments._id, comment._id);
                                      }
                                    }}
                                    placeholder="Type your reply..."
                                    autoFocus
                                    style={{
                                      flex: 1,
                                      padding: '0.6rem 0.8rem',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '6px',
                                      fontSize: '0.85rem',
                                      outline: 'none'
                                    }}
                                  />
                                  <button 
                                    onClick={() => handleReplySubmit(viewingComments._id, comment._id)}
                                    disabled={submittingReply || !replyText.trim()}
                                    style={{
                                      background: '#007bff',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.6rem 1rem',
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      cursor: (submittingReply || !replyText.trim()) ? 'not-allowed' : 'pointer',
                                      opacity: (submittingReply || !replyText.trim()) ? 0.5 : 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    {submittingReply ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <>
                                        <MessageSquare size={14} />
                                        <span>Send</span>
                                      </>
                                    )}
                                  </button>
                                  <button 
                                    onClick={() => { setReplyingToComment(null); setReplyText(''); }}
                                    style={{
                                      background: '#ffffff',
                                      color: '#64748b',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '6px',
                                      padding: '0.6rem 1rem',
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Nested Replies */}
                          {replies.length > 0 && (
                            <div style={{ marginLeft: '2.5rem', marginTop: '1rem' }}>
                              {replies.map((reply) => (
                                <div 
                                  key={reply._id}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem',
                                    borderLeft: '3px solid #007bff'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {reply.user?.profilePhoto ? (
                                      <img 
                                        src={reply.user.profilePhoto} 
                                        alt={reply.user?.name || 'User'}
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          border: '1px solid #e2e8f0'
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: reply.user?.role === 'admin' ? '#fee2e2' : '#dbeafe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: reply.user?.role === 'admin' ? '#dc2626' : '#007bff'
                                      }}>
                                        {reply.user?.name?.charAt(0).toUpperCase() || 'A'}
                                      </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                      <div style={{ 
                                        fontSize: '0.8rem', 
                                        fontWeight: 600, 
                                        color: reply.user?.role === 'admin' ? '#dc2626' : '#1e293b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}>
                                        {reply.user?.name || reply.user?.username || 'Unknown User'}
                                        {reply.user?.role === 'admin' && (
                                          <span style={{
                                            backgroundColor: '#dc2626',
                                            color: '#ffffff',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem',
                                            fontWeight: 700
                                          }}>
                                            ADMIN
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                        {getRelativeTime(reply.createdAt)}
                                      </div>
                                    </div>
                                    {/* Edit button for admin's own comments */}
                                    {reply.user?.role === 'admin' && (
                                      <button 
                                        onClick={() => {
                                          setEditingComment(editingComment === reply._id ? null : reply._id);
                                          setEditText(reply.text);
                                        }}
                                        style={{
                                          background: '#f8fafc',
                                          color: '#007bff',
                                          border: '1px solid #007bff',
                                          borderRadius: '4px',
                                          padding: '0.25rem 0.5rem',
                                          fontSize: '0.7rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.2rem'
                                        }}
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Edit Mode or Display Mode */}
                                  {editingComment === reply._id ? (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                          type="text"
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              handleEditComment(viewingComments._id, reply._id);
                                            }
                                          }}
                                          autoFocus
                                          style={{
                                            flex: 1,
                                            padding: '0.5rem 0.6rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            outline: 'none'
                                          }}
                                        />
                                        <button 
                                          onClick={() => handleEditComment(viewingComments._id, reply._id)}
                                          disabled={updatingComment || !editText.trim()}
                                          style={{
                                            background: '#007bff',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: (updatingComment || !editText.trim()) ? 'not-allowed' : 'pointer',
                                            opacity: (updatingComment || !editText.trim()) ? 0.5 : 1
                                          }}
                                        >
                                          {updatingComment ? 'Saving...' : 'Save'}
                                        </button>
                                        <button 
                                          onClick={() => { setEditingComment(null); setEditText(''); }}
                                          style={{
                                            background: '#ffffff',
                                            color: '#64748b',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '4px',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5, margin: 0 }}>
                                      {reply.text}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>No comments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
