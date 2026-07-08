import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar, { Footer } from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import ViewComplaints from './pages/ViewComplaints';
import Profile from './pages/Profile';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className="app-container">
      {!isAdminRoute && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/complaints" element={<ViewComplaints />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminRegister />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
