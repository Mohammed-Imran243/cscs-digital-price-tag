const fs = require('fs');

const loginFile = 'src/pages/Login.tsx';
let content = fs.readFileSync(loginFile, 'utf8');

// 1. Reduce top padding of login card
content = content.replace(
  /padding: 48px 48px;/,
  `padding: 32px 48px;`
);

// 2. Reduce gap between logo and title, and above logo (assuming image has empty space)
content = content.replace(
  /\.logo-container \{\n\s+display: flex;\n\s+justify-content: center;\n\s+align-items: center;\n\s+margin-bottom: 12px;\n\s+margin-top: -16px;\n\s+\}/,
  `.logo-container {\n          display: flex;\n          justify-content: center;\n          align-items: center;\n          margin-bottom: -32px;\n          margin-top: -40px;\n        }`
);

// 3. Keep equal and balanced spacing (title to form)
content = content.replace(
  /margin-bottom: 40px;/,
  `margin-bottom: 32px;`
);

fs.writeFileSync(loginFile, content, 'utf8');
console.log('Successfully adjusted vertical spacing');
