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
          <div className="logo-container">
            <img src="/cscs-logo-login-cropped.png" alt="CSCS Logo" className="logo-img" />
          </div>
          <h2 className="login-title">Login / تسجيل الدخول</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="cscs-username"
              id="cscs-username"
              placeholder="Username"
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
              placeholder="Password"
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

      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-height: 100vh;
          width: 100vw;
          background: url('/UPDATE-LOGIN-BG.png') center/cover no-repeat;
          padding: 20px;
          position: relative;
        }

        .login-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65); /* Dark Navy Overlay */
          z-index: 1;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 48px 40px;
          text-align: center;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.7);
          margin-right: 10%;
          position: relative;
          z-index: 2;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }

        .logo-img {
          width: 250px;
          height: auto;
          object-fit: contain;
          mix-blend-mode: screen;
        }

        .login-title {
          font-size: 24px;
          margin-bottom: 32px;
          color: #f8fafc;
          font-weight: 700;
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

        @media (max-width: 992px) {
          .login-page {
            justify-content: center;
          }
          
          .login-card {
            margin-right: 0;
            margin: 20px;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }
          .login-header h2 {
            font-size: 24px;
          }
          .logo-img {
            width: 220px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
