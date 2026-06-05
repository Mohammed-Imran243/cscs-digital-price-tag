const fs = require('fs');

const loginFile = 'src/pages/Login.tsx';
let content = fs.readFileSync(loginFile, 'utf8');

// Replace the logo src
content = content.replace(/\/cscs-logo-login-cropped\.png/g, '/esl-connect-logo.png');

const newStyles = `
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
          padding: 64px 48px;
          text-align: center;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
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
          box-shadow: 0 0 20px rgba(59,130,246,0.25), 0 0 40px rgba(59,130,246,0.15), 0 30px 60px -15px rgba(0, 0, 0, 0.8);
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: conic-gradient(transparent, rgba(59,130,246,0.1), transparent 30%, #3b82f6 50%, transparent 50%);
          animation: borderShine 4s linear infinite;
          z-index: -2;
        }
        
        .login-card::after {
          content: '';
          position: absolute;
          inset: 1.5px;
          background: rgba(15, 23, 42, 0.85);
          border-radius: 26px;
          z-index: -1;
        }
        
        @keyframes borderShine {
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
          margin-bottom: 32px;
        }

        .logo-img {
          height: auto;
          width: 100%;
          max-width: 240px;
          object-fit: contain;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        }

        .login-title {
          font-size: 26px;
          font-weight: 700;
          color: white;
          margin-bottom: 40px;
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
            max-width: 200px;
          }
        }
`;

const startIndex = content.indexOf('<style>{`');
const endIndex = content.lastIndexOf('`}</style>');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex + 9) + '\n' + newStyles + '\n      ' + content.substring(endIndex);
  fs.writeFileSync(loginFile, content, 'utf8');
  console.log('Successfully enhanced Login UI');
} else {
  console.log('Failed to find <style> block');
}
