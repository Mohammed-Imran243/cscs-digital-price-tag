import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login({ userId, password });
      navigate('/');
    } catch (err: any) {
      const rawError = err.response?.data?.message || '';
      let friendlyMsg = 'Invalid username or password. Please verify your ESL credentials and try again. / اسم المستخدم أو كلمة المرور غير صالحة. يرجى التحقق من بيانات اعتماد ESL والمحاولة مرة أخرى.';
      
      if (rawError.includes('resolve') || rawError.includes('Network') || rawError.includes('Failed to resolve')) {
        friendlyMsg = 'Network error: Failed to connect to Dragon ESL server. Please check your internet connection. / خطأ في الشبكة: فشل الاتصال بخادم Dragon ESL. يرجى التحقق من اتصالك بالإنترنت.';
      }
      
      setError(friendlyMsg);
      
      // Auto-clear the error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="logo">CSCS</div>
          <h2>Welcome Back / مرحباً بعودتك</h2>
          <p>Digital Price Tag Management Platform / منصة إدارة بطاقات الأسعار الرقمية</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="cscs-username"
              id="cscs-username"
              placeholder="Username / اسم المستخدم"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              name="cscs-password"
              id="cscs-password"
              placeholder="Password / كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="login-btn btn-primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login / تسجيل الدخول'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2024 CSCS Platform. All rights reserved / جميع الحقوق محفوظة.</p>
        </div>
      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%);
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          text-align: center;
        }

        .login-header .logo {
          font-size: 32px;
          font-weight: 900;
          color: var(--primary-color);
          margin-bottom: 8px;
        }

        .login-header h2 {
          font-size: 24px;
          margin-bottom: 8px;
          color: white;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 32px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        .input-group input {
          width: 100%;
          padding: 14px 14px 14px 46px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 15px;
          transition: all 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.1);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        }

        .login-footer {
          margin-top: 32px;
          font-size: 12px;
          color: #64748b;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
