const fs = require('fs');

const loginFile = 'src/pages/Login.tsx';
let content = fs.readFileSync(loginFile, 'utf8');

// Replace the image source
content = content.replace(
  /<img src="\/cscs-logo-login-cropped\.png" alt="CSCS Logo" className="logo-img" \/>/,
  '<img src="/esl-connect-logo.png" alt="ESL Connect App Logo" className="logo-img" />'
);

// Update the logo-img CSS to handle potentially black background and increase size
content = content.replace(
  /\.logo-img \{\s+height: auto;\s+width: 100%;\s+max-width: 240px;/,
  `.logo-img {\n          height: auto;\n          width: 100%;\n          max-width: 280px;\n          mix-blend-mode: screen;\n          object-fit: contain;`
);

content = content.replace(
  /\.logo-img \{\s+max-width: 200px;\s+\}/,
  `.logo-img {\n              max-width: 240px;\n            }`
);

fs.writeFileSync(loginFile, content, 'utf8');
console.log('Successfully updated logo');
