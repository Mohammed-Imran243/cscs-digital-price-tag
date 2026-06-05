const fs = require('fs');

const loginFile = 'src/pages/Login.tsx';
let content = fs.readFileSync(loginFile, 'utf8');

// 1. Add import statement at the top if it doesn't exist
if (!content.includes("import eslLogo from '../assets/esl-connect-logo.png';")) {
  // Find the first import and add it after
  content = content.replace(
    /(import React[^;]*;)/,
    `$1\nimport eslLogo from '../assets/esl-connect-logo.png';`
  );
}

// 2. Change the src to use the imported variable instead of public path
content = content.replace(
  /<img src="\/esl-connect-logo\.png" alt="ESL Connect App Logo" className="logo-img" \/>/,
  '<img src={eslLogo} alt="ESL Connect App Logo" className="logo-img" />'
);

fs.writeFileSync(loginFile, content, 'utf8');
console.log('Successfully updated Login.tsx to import logo from assets');
