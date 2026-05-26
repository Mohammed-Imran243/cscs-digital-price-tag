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
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <img src="/cscs.png" alt="CSCS Logo" className="logo-img" />
          </div>
          <h2>Welcome Back / مرحباً بعودتك</h2>
          <p>CSCS ESL CONNECT APP / منصة إدارة بطاقات الأسعار الرقمية</p>
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
          max-width: 440px;
          padding: 48px 40px;
          text-align: center;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          margin: 20px;
        }

        .login-header .logo {
          display: flex;
          justify-content: center;
          margin-bottom: 8px; /* Reduced margin because the logo image might have internal padding */
        }

        .logo-img {
          height: 120px; /* Significantly increased from 52px */
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)) invert(1) brightness(2);
        }

        .login-header h2 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #f8fafc;
          font-weight: 700;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 15px;
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
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        
        .login-btn:hover {
          background: #2563eb;
        }
        
        .login-btn:active {
          transform: scale(0.98);
        }

        .login-footer {
          margin-top: 32px;
          font-size: 12px;
          color: #64748b;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }
          .login-header h2 {
            font-size: 24px;
          }
          .logo-img {
            height: 90px; /* Scaled down for mobile, but still large */
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
