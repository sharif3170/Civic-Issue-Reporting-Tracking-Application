import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  AlertCircle,
  LightbulbOff,
  Trash2,
  Droplet,
  Loader2,
  Send
} from 'lucide-react';

const getTypeIcon = (type) => {
  switch(type) {
    case 'pothole': return <AlertCircle size={20} color="#6b21a8" />;
    case 'streetlight': return <LightbulbOff size={20} color="#d97706" />;
    case 'garbage': return <Trash2 size={20} color="#64748b" />;
    case 'water': return <Droplet size={20} color="#0284c7" />;
    default: return <AlertCircle size={20} color="#64748b" />;
  }
};

const ViewComplaints = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [voting, setVoting] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Fetch issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/issues');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch issues');
        }

        setReports(data.issues);
      } catch (err) {
        console.error('Error fetching issues:', err);
        // Fallback to empty array on error
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
    
    // Get current user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user from localStorage', err);
      }
    }
  }, []);

  // Format date to relative time
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Filter reports based on status and type
  const filteredReports = reports.filter(report => {
    const statusMatch = statusFilter === 'All Status' || 
                        report.status === statusFilter.toLowerCase().replace(' ', '-');
    const typeMatch = typeFilter === 'All Types' || report.type === typeFilter.toLowerCase();
    return statusMatch && typeMatch;
  });

  // Handle upvote
  const handleUpvote = async (issueId) => {
    if (!currentUser) {
      alert('Please login to vote on issues');
      return;
    }

    try {
      setVoting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upvote');
      }

      const updatedIssue = await response.json();
      setReports(reports.map(report => 
        report._id === issueId ? updatedIssue : report
      ));
    } catch (err) {
      console.error('Error upvoting:', err);
      alert('Failed to upvote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  // Handle downvote
  const handleDownvote = async (issueId) => {
    if (!currentUser) {
      alert('Please login to vote on issues');
      return;
    }

    try {
      setVoting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/downvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to downvote');
      }

      const updatedIssue = await response.json();
      setReports(reports.map(report => 
        report._id === issueId ? updatedIssue : report
      ));
    } catch (err) {
      console.error('Error downvoting:', err);
      alert('Failed to downvote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (issueId, parentCommentId = null) => {
    if (!currentUser) {
      alert('Please login to comment');
      return;
    }

    const textToSubmit = parentCommentId ? replyText : commentText;
    
    if (!textToSubmit.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: textToSubmit,
          parentCommentId: parentCommentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const updatedIssue = await response.json();
      setReports(reports.map(report => 
        report._id === issueId ? updatedIssue : report
      ));
      
      if (parentCommentId) {
        setReplyText('');
        setReplyingToComment(null);
      } else {
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle card expansion for comments
  const toggleCardExpansion = (issueId) => {
    setExpandedCard(expandedCard === issueId ? null : issueId);
    setCommentText('');
    setReplyingToComment(null);
    setReplyText('');
  };

  return (
    <div className="page-container" style={{ alignItems: 'flex-start' }}>
      <div className="reports-container">
        
        {/* Header and Filters */}
        <div className="reports-header-section">
          <h2 className="reports-page-title">Community Reports</h2>
          
          <div className="reports-filters">
            <select 
              className="form-select filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Received">Received</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            
            <select 
              className="form-select filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="pothole">Road Damage</option>
              <option value="streetlight">Streetlight</option>
              <option value="garbage">Garbage</option>
              <option value="water">Water Issue</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="reports-grid">
          {loading ? (
            <div className="loading-indicator">
              <Loader2 className="spinner" />
              <p>Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>No Reports Found</h3>
              <p>Be the first to report a civic issue in your area!</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report._id} className="complaint-card">
                
                {/* Card Header (Icon, Title, Status) */}
                <div className="complaint-header">
                  <div className="complaint-title-group">
                    <div className="complaint-icon">
                      {getTypeIcon(report.type)}
                    </div>
                    <h3 className="complaint-title">{report.title}</h3>
                  </div>
                  <div className={`complaint-status bg-${report.status === 'pending' ? 'blue' : report.status === 'in-progress' ? 'yellow' : report.status === 'resolved' ? 'green' : 'red'}`}>
                    {report.status === 'pending' ? 'Received' : report.status === 'in-progress' ? 'In Progress' : report.status === 'resolved' ? 'Resolved' : 'Rejected'}
                  </div>
                </div>
                
                {/* Card Body (Description) */}
                <div className="complaint-body">
                  <p className="complaint-desc">{report.description}</p>
                </div>
                
                {/* Metadata (Location & Time) */}
                <div className="complaint-meta">
                  <div className="meta-item">
                    <MapPin size={16} />
                    <span>{report.address}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{getRelativeTime(report.createdAt)}</span>
                  </div>
                </div>
                
                {/* Card Footer (Votes & Comments) */}
                <div className="complaint-footer">
                  <div className="footer-actions">
                    <button 
                      className={`action-btn ${report.votes?.upvotes?.includes(currentUser?._id || currentUser?.id) ? 'voted' : ''}`}
                      onClick={() => handleUpvote(report._id)}
                      disabled={voting}
                    >
                      <ThumbsUp size={16} />
                      <span>{report.votes?.upvotes?.length || 0}</span>
                    </button>
                    <button 
                      className={`action-btn text-light ${report.votes?.downvotes?.includes(currentUser?._id || currentUser?.id) ? 'voted' : ''}`}
                      onClick={() => handleDownvote(report._id)}
                      disabled={voting}
                    >
                      <ThumbsDown size={16} />
                      <span>{report.votes?.downvotes?.length || 0}</span>
                    </button>
                  </div>
                  <button 
                    className="action-btn comment-btn"
                    onClick={() => toggleCardExpansion(report._id)}
                  >
                    <MessageSquare size={16} />
                    <span>Comments ({report.comments?.length || 0})</span>
                  </button>
                </div>

                {/* Expanded Comment Section */}
                {expandedCard === report._id && (
                  <div className="comment-section">
                    <div className="comments-list">
                      {report.comments && report.comments.length > 0 ? (
                        // Show only top-level comments (no parent)
                        report.comments
                          .filter(comment => !comment.parentComment)
                          .map((comment) => {
                            // Find replies to this comment
                            const replies = report.comments.filter(
                              c => c.parentComment?.toString() === comment._id.toString()
                            );

                            return (
                              <div key={comment._id} style={{ marginBottom: '1.5rem' }}>
                                {/* Main Comment */}
                                <div className="comment-item" style={{ marginBottom: '0.5rem' }}>
                                  <div className="comment-header">
                                    <div className="comment-user-info">
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
                                        <span className="comment-username" style={{ fontSize: '0.9rem' }}>
                                          {comment.user?.name || comment.user?.username || 'Unknown User'}
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                                          {getRelativeTime(comment.createdAt)}
                                        </div>
                                      </div>
                                    </div>
                                    {currentUser && (
                                      <button 
                                        onClick={() => setReplyingToComment(replyingToComment === comment._id ? null : comment._id)}
                                        style={{
                                          background: replyingToComment === comment._id ? '#007bff' : '#f8fafc',
                                          color: replyingToComment === comment._id ? '#ffffff' : '#007bff',
                                          border: '1px solid #007bff',
                                          borderRadius: '6px',
                                          padding: '0.3rem 0.6rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}
                                      >
                                        <MessageSquare size={12} />
                                        <span>Reply</span>
                                      </button>
                                    )}
                                  </div>
                                  <p className="comment-text" style={{ marginTop: '0.75rem' }}>{comment.text}</p>

                                  {/* Reply Input */}
                                  {replyingToComment === comment._id && (
                                    <div style={{
                                      marginTop: '1rem',
                                      padding: '0.75rem',
                                      backgroundColor: '#f8fafc',
                                      borderRadius: '6px',
                                      borderTop: '2px solid #007bff'
                                    }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#007bff', marginBottom: '0.5rem' }}>
                                        Replying to {comment.user?.name || comment.user?.username || 'User'}
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                          type="text"
                                          className="comment-input"
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              handleCommentSubmit(report._id, comment._id);
                                            }
                                          }}
                                          placeholder="Write a reply..."
                                          autoFocus
                                          style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                        />
                                        <button 
                                          className="comment-submit-btn"
                                          onClick={() => handleCommentSubmit(report._id, comment._id)}
                                          disabled={submittingComment || !replyText.trim()}
                                          style={{ padding: '0.5rem 0.75rem' }}
                                        >
                                          {submittingComment ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
                                        </button>
                                        <button 
                                          onClick={() => { setReplyingToComment(null); setReplyText(''); }}
                                          style={{
                                            background: '#ffffff',
                                            color: '#64748b',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            padding: '0.5rem 0.75rem',
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
                                  <div style={{ marginLeft: '2.5rem', marginTop: '0.75rem' }}>
                                    {replies.map((reply) => (
                                      <div 
                                        key={reply._id}
                                        style={{
                                          padding: '0.75rem',
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
                                              {reply.user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                          )}
                                          <div>
                                            <div style={{ 
                                              fontSize: '0.8rem', 
                                              fontWeight: 600, 
                                              color: reply.user?.role === 'admin' ? '#dc2626' : '#1e293b',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.4rem'
                                            }}>
                                              {reply.user?.name || reply.user?.username || 'Unknown User'}
                                              {reply.user?.role === 'admin' && (
                                                <span style={{
                                                  backgroundColor: '#dc2626',
                                                  color: '#ffffff',
                                                  padding: '0.1rem 0.3rem',
                                                  borderRadius: '3px',
                                                  fontSize: '0.6rem',
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
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5, margin: 0 }}>
                                          {reply.text}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                      ) : (
                        <p className="no-comments">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                    
                    {currentUser ? (
                      <div className="comment-input-wrapper">
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCommentSubmit(report._id);
                            }
                          }}
                        />
                        <button 
                          className="comment-submit-btn"
                          onClick={() => handleCommentSubmit(report._id)}
                          disabled={submittingComment || !commentText.trim()}
                        >
                          {submittingComment ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
                        </button>
                      </div>
                    ) : (
                      <p className="login-to-comment">Please <a href="/login">login</a> to comment</p>
                    )}
                  </div>
                )}

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default ViewComplaints;
