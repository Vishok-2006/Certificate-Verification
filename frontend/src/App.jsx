import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import IssueCertificate from './pages/IssueCertificate';
import StudentDashboard from './pages/StudentDashboard';
import VerifyCertificate from './pages/VerifyCertificate';
import CertificateDetails from './pages/CertificateDetails';

function AppShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  const pageClass = useMemo(() => 'min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] transition-colors duration-300', []);

  return (
    <div className={pageClass}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:id" element={<VerifyCertificate />} />
        <Route path="/certificates/:id" element={<CertificateDetails />} />
        <Route path="/dashboard/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/issuer" element={<ProtectedRoute roles={['issuer', 'admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/verifier" element={<ProtectedRoute roles={['verifier']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/issue" element={<ProtectedRoute roles={['issuer', 'admin']}><IssueCertificate /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}

export default App;
