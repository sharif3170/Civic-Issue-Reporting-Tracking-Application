import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Mail, Phone, MapPin } from 'lucide-react';

const CrossLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-icon text-primary">
       <path d="M12 2v20M2 12h20" />
    </svg>
)

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">
              <CrossLogo />
              <span>CleanStreet</span>
            </Link>
            <p className="footer-description">
              Empowering citizens to report and track civic issues. Together, we build better communities.
            </p>
            <div className="footer-social">
              <button className="social-link" aria-label="Facebook" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </button>
              <button className="social-link" aria-label="Twitter" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </button>
              <button className="social-link" aria-label="Instagram" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </button>
              <button className="social-link" aria-label="LinkedIn" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/report">Report Issue</Link></li>
              <li><Link to="/complaints">View Complaints</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h3 className="footer-title">Support</h3>
            <ul className="footer-links">
              <li><button onClick={(e) => e.preventDefault()}>Help Center</button></li>
              <li><button onClick={(e) => e.preventDefault()}>FAQs</button></li>
              <li><button onClick={(e) => e.preventDefault()}>Terms of Service</button></li>
              <li><button onClick={(e) => e.preventDefault()}>Privacy Policy</button></li>
              <li><button onClick={(e) => e.preventDefault()}>Contact Us</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <MapPin size={18} />
                <span>123 Civic Street, City Hall, NY 10001</span>
              </li>
              <li>
                <Phone size={18} />
                <span>+1 (555) 123-4567</span>
              </li>
              <li>
                <Mail size={18} />
                <span>support@cleanstreet.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} CleanStreet. All rights reserved.</p>
            <p>Made with ❤️ for better communities</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user from localStorage', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left Side: Logo */}
        <Link to="/" className="navbar-logo">
          {/* A plus icon to mimic the CleanStreet logo */}
          <div className="logo-icon-wrapper">
             <CrossLogo />
          </div>
          <span className="logo-text">CleanStreet</span>
        </Link>

        {/* Center: Links */}
        <ul className="navbar-links">
          {user?.role !== 'admin' && (
            <li>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            </li>
          )}
          <li>
            <Link to={user?.role === 'admin' ? "/admin-dashboard" : "/dashboard"} className={`nav-link ${location.pathname === '/dashboard' || location.pathname === '/admin-dashboard' ? 'active' : ''}`}>Dashboard</Link>
          </li>
          {user?.role !== 'admin' && (
            <li>
              <Link to="/report" className={`nav-link ${location.pathname === '/report' ? 'active' : ''}`}>Report Issue</Link>
            </li>
          )}
          <li>
            <Link to="/complaints" className={`nav-link ${location.pathname === '/complaints' ? 'active' : ''}`}>View Complaints</Link>
          </li>
          <li>
            <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</Link>
          </li>
        </ul>

        {/* Right: Auth Buttons */}
        <div className="navbar-auth">
          {user ? (
            <div className="user-profile-nav">
              <div className="user-info">
                {user.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt="User" 
                    className="avatar-image-small"
                  />
                ) : (
                  <User size={18} className="user-icon" />
                )}
                <span className="user-name">{user.name || 'User'}</span>
              </div>

              <button 
                onClick={handleLogout} 
                className="btn btn-outline logout-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
export { Footer };

