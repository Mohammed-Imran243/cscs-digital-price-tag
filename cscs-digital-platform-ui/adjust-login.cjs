const fs = require('fs');

const loginFile = 'src/pages/Login.tsx';
let content = fs.readFileSync(loginFile, 'utf8');

// 1. Adjust login card padding (reduce top spacing)
content = content.replace(
  /padding: 64px 48px;/,
  `padding: 48px 48px;`
);

// Add animated border if it's missing (they wanted it maintained, but it was removed)
// Actually they said "Maintain the premium dark theme and animated border." 
// Let's add the animated border back.
if (!content.includes('@keyframes rotate-border')) {
  content = content.replace(
    /\.login-card \{\s+width: 100%;\s+max-width: 480px;/,
    `.login-card {\n          width: 100%;\n          max-width: 480px;`
  );
  
  // Add before/after for border
  content = content.replace(
    /\.login-header, \.login-form \{/,
    `.login-card::before {
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

        .login-header, .login-form {`
  );
  
  // Adjust card background so the border is visible
  content = content.replace(
    /background: rgba\(15, 23, 42, 0\.65\);\s+backdrop-filter: blur\(32px\);\s+-webkit-backdrop-filter: blur\(32px\);/,
    `background: transparent;`
  );
}

// 2. Adjust hover shadow (reduce by 50%)
content = content.replace(
  /box-shadow: 0 0 20px rgba\(59,130,246,0\.25\), 0 0 40px rgba\(59,130,246,0\.15\), 0 30px 60px -15px rgba\(0, 0, 0, 0\.8\);/,
  `box-shadow: 0 0 20px rgba(59,130,246,0.12), 0 0 40px rgba(59,130,246,0.07), 0 30px 60px -15px rgba(0, 0, 0, 0.8);`
);

// 3. Move Login title closer to logo
content = content.replace(
  /\.logo-container \{\s+display: flex;\s+justify-content: center;\s+align-items: center;\s+margin-bottom: 32px;\s+\}/,
  `.logo-container {\n          display: flex;\n          justify-content: center;\n          align-items: center;\n          margin-bottom: 12px;\n          margin-top: -16px;\n        }`
);

// 4. Increase logo size and readability
content = content.replace(
  /\.logo-img \{\s+height: auto;\s+width: 100%;\s+max-width: 280px;\s+mix-blend-mode: screen;\s+object-fit: contain;\s+object-fit: contain;\s+filter: drop-shadow\(0 4px 6px rgba\(0,0,0,0\.3\)\);\s+\}/,
  `.logo-img {\n          height: auto;\n          width: 100%;\n          max-width: 420px;\n          mix-blend-mode: screen;\n          object-fit: contain;\n          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8)) brightness(1.1);\n          transform: scale(1.15);\n        }`
);

// 5. Mobile adjustment
content = content.replace(
  /\.logo-img \{\s+max-width: 240px;\s+\}/,
  `.logo-img {\n              max-width: 320px;\n              transform: scale(1.1);\n            }`
);

fs.writeFileSync(loginFile, content, 'utf8');
console.log('Successfully adjusted login card');
