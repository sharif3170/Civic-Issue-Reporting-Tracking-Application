import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Heart } from 'lucide-react';

const Home = () => {
  return (
    <div className="home-container">
      
      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-content">
          <h1 className="hero-title">Make Your City Cleaner & Smarter</h1>
          <p className="hero-subtitle">
            Report civic issues, track progress, and help build a better community together.
          </p>
          <div className="hero-action-buttons">
            <Link to="/report" className="btn btn-hero">
              <Plus size={16} strokeWidth={2.5} />
              <span>Report an Issue</span>
            </Link>
            <Link to="/complaints" className="btn btn-hero">
              <Eye size={16} strokeWidth={2.5} />
              <span>View Reports</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="home-how-it-works-section">
        <div className="how-it-works-content">
          <div className="how-it-works-header">
            <h2>How CleanStreet Works</h2>
            <p>Simple steps to make a difference in your community</p>
          </div>

          <div className="how-it-works-grid">
            
            <div className="how-step">
              <div className="step-icon text-blue">
                <Plus size={32} />
              </div>
              <h3 className="step-title">Report Issues</h3>
              <p className="step-desc">
                Easily report civic problems with photos and location details to alert local authorities.
              </p>
            </div>

            <div className="how-step">
              <div className="step-icon text-blue">
                <Eye size={32} />
              </div>
              <h3 className="step-title">Track Progress</h3>
              <p className="step-desc">
                Monitor the status of reported issues and see updates closely in real-time.
              </p>
            </div>

            <div className="how-step">
              <div className="step-icon text-orange">
                <Heart size={32} />
              </div>
              <h3 className="step-title">Community Impact</h3>
              <p className="step-desc">
                Vote and comment on issues to help prioritize community needs and drive fast resolutions.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
