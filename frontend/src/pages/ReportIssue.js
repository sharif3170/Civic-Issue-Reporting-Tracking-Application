import React, { useState, useEffect, useRef } from 'react';
import { Send, Camera, Search, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Child component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Child component to update map view when center changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, map]);
  return null;
}

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    priority: '',
    address: '',
    landmark: '',
    description: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Default map position
  const defaultCenter = [40.7128, -74.0060];
  const [position, setPosition] = useState(null); 
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum size is 5MB.');
        return;
      }
      
      setPhoto(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (value.trim().length > 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`);
          const data = await response.json();
          if (data && data.length > 0) {
            setSuggestions(data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error("Autosuggest error:", error);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    const newPos = [parseFloat(item.lat), parseFloat(item.lon)];
    setSearchQuery(item.display_name);
    setMapCenter(newPos);
    setPosition(newPos);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchClick = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newPos);
        setPosition(newPos);
        setSearchQuery(data[0].display_name);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Error occurred while searching. Please try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate location
    if (!position) {
      alert('Please select a location on the map');
      return;
    }

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to report an issue');
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    try {
      const issueData = {
        ...formData,
        location: position,
        photo: photoBase64
      };

      const response = await fetch('http://localhost:5000/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(issueData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to report issue');
      }

      console.log('Issue reported successfully:', data);
      alert('Issue reported successfully!');
      
      // Reset form
      setFormData({
        title: '',
        type: '',
        priority: '',
        address: '',
        landmark: '',
        description: '',
      });
      setPhoto(null);
      setPhotoBase64(null);
      setPosition(null);
      setSearchQuery('');
      
      // Redirect to complaints page
      window.location.href = '/complaints';
    } catch (err) {
      console.error('Error reporting issue:', err);
      alert(err.message || 'Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="report-card">
        <h2 className="page-title text-center">Report a Civic Issue</h2>
        
        <div className="panel-card p-2rem">
          <h3 className="panel-title mb-1.5">Issue Details</h3>
          
          <form onSubmit={handleSubmit} className="auth-form report-form">
            
            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="title">Issue Title</label>
                <input 
                  type="text" 
                  id="title" 
                  placeholder="Brief description of the issue" 
                  value={formData.title}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Issue Type</label>
                <select id="type" value={formData.type} onChange={handleChange} required className="form-select">
                  <option value="" disabled>Select issue type</option>
                  <option value="pothole">Pothole / Road Damage</option>
                  <option value="streetlight">Streetlight Outage</option>
                  <option value="garbage">Garbage / Dumping</option>
                  <option value="water">Water Leak</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority Level</label>
                <select id="priority" value={formData.priority} onChange={handleChange} required className="form-select">
                  <option value="" disabled>Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  placeholder="Enter street address" 
                  value={formData.address}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="landmark">Nearby Landmark (Optional)</label>
              <input 
                type="text" 
                id="landmark" 
                placeholder="e.g., Near City Hall" 
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                placeholder="Describe the issue in detail..." 
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Photo Upload</label>
              <div className="file-upload-wrapper">
                <input 
                  type="file" 
                  id="photoUpload" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="file-input-hidden" 
                />
                <label htmlFor="photoUpload" className="file-upload-box">
                  <Camera size={32} className="text-light mb-0.5" />
                  <span className="text-dark font-medium">{photo ? photo.name : 'Click or drag photo to upload'}</span>
                  <span className="text-sm text-light mt-0.25">JPG, PNG, GIF up to 5MB</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Location on Map</label>
              <p className="text-sm text-light mb-0.5">Search for an address or click on the map to mark the exact location</p>
              
              {/* Location Search Bar with Autocomplete */}
              <div className="location-search-wrapper mb-1" ref={wrapperRef}>
                <div className="search-input-group position-relative">
                  <input 
                    type="text" 
                    placeholder="Search for an area or city..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                    className="form-input search-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchClick(e);
                      }
                    }}
                  />
                  <button type="button" onClick={handleSearchClick} disabled={isSearching} className="btn-search">
                    <Search size={18} />
                    {isSearching ? 'Search...' : 'Search'}
                  </button>
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggestions-dropdown">
                      {suggestions.map((item, index) => (
                        <li 
                          key={index} 
                          className="suggestion-item"
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <MapPin size={16} className="suggestion-icon" />
                          <span className="suggestion-text">{item.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="map-wrapper">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '300px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={position} setPosition={setPosition} />
                  <MapUpdater center={mapCenter} />
                </MapContainer>
              </div>
            </div>

            <div className="form-submit-wrapper">
              <button type="submit" className="btn btn-primary btn-icon" disabled={loading}>
                <Send size={18} />
                <span>{loading ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
