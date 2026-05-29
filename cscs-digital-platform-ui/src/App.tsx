import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stores from './pages/Stores';
import Products from './pages/Products';
import Templates from './pages/Templates';
import Devices from './pages/Devices';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Merchants from './pages/Merchants';
import TemplateEditor from './pages/TemplateEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import './styles/theme.css';
 
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredPermission?: string }> = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#020617',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <Loader2 className="animate-spin" size={40} style={{ color: '#3b82f6', marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Restoring session...</p>
      </div>
    );
  }
  if (isAuthenticated && requiredPermission) {
    if (!user?.permissions?.includes(requiredPermission)) {
      return <Navigate to="/" />;
    }
  }
  
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              {/* Placeholders for other routes */}
              <Route path="/merchants" element={<ProtectedRoute requiredPermission="staffManager"><Merchants /></ProtectedRoute>} />
              <Route path="/stores" element={<ProtectedRoute requiredPermission="store"><Stores /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute requiredPermission="product"><Products /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute requiredPermission="template"><Templates /></ProtectedRoute>} />
              <Route path="/template/editor/:id" element={<ProtectedRoute requiredPermission="template"><TemplateEditor /></ProtectedRoute>} />
              <Route path="/template/editor" element={<ProtectedRoute requiredPermission="template"><TemplateEditor /></ProtectedRoute>} />
              <Route path="/devices" element={<ProtectedRoute requiredPermission="equipment"><Devices /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute requiredPermission="log"><AuditLogs /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requiredPermission="staffManager"><Users /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
