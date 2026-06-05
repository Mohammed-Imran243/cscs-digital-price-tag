import React, { useState } from 'react';
import eslLogo from '../assets/esl-connect-logo.png';
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
      
      if (rawError.includes('resolve') || rawError.includes('Failed to resolve') || err.message === 'Network Error' || String(err).includes('Network Error')) {
        friendlyMsg = 'Network error: Failed to connect to the server. Please check your internet connection. / خطأ في الشبكة: فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
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
            <img src={eslLogo} alt="ESL Connect App Logo" className="logo-img" />
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
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 15, 30, 0.7);
          z-index: 1;
        }

        .login-card {
          width: 100%;
          max-width: 480px;
          min-height: 560px;
          padding: 32px 48px;
          text-align: center;
          background: transparent;
          border-radius: 28px;
          margin-right: 10%;
          position: relative;
          z-index: 2;
          overflow: hidden;
          transition: all 0.4s ease;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .login-card:hover {
          box-shadow: 0 0 20px rgba(59,130,246,0.12), 0 0 40px rgba(59,130,246,0.07), 0 30px 60px -15px rgba(0, 0, 0, 0.8);
        }

        
        
        
        
        

        .login-card::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 30px;
          background: conic-gradient(from 0deg, transparent 60%, rgba(59,130,246,0.5), rgba(99,102,241,0.8));
          animation: rotate-border 6s linear infinite;
          z-index: -2;
        }

        .login-card::after {
          content: '';
          position: absolute;
          inset: 1.5px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border-radius: 27px;
          z-index: -1;
        }

        @keyframes rotate-border {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-header, .login-form {
          position: relative;
          z-index: 1;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: -32px;
          margin-top: -40px;
        }

        .logo-img {
          height: auto;
          width: 100%;
          max-width: 420px;
          mix-blend-mode: screen;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8)) brightness(1.1);
          transform: scale(1.15);
        }

        .login-title {
          font-size: 26px;
          font-weight: 700;
          color: white;
          margin-bottom: 32px;
          letter-spacing: -0.5px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          margin-bottom: 8px;
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.3s;
        }

        .input-group input {
          width: 100%;
          padding: 16px 16px 16px 50px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 0 15px rgba(59,130,246,0.1);
        }
        
        .input-group input:focus + .input-icon,
        .input-group input:focus ~ .input-icon {
          color: var(--primary-color);
        }

        .login-btn {
          width: 100%;
          padding: 18px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(59,130,246,0.2);
        }
        
        .login-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59,130,246,0.4);
        }
        
        .login-btn:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
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
            padding: 40px 24px;
            min-height: auto;
          }
          .login-header h2 {
            font-size: 24px;
          }
          .logo-img {
              max-width: 320px;
              transform: scale(1.1);
            }
        }

      `}</style>
    </div>
  );
};

export default LoginPage;
