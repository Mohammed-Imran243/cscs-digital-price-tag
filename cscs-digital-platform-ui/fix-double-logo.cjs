const fs = require('fs');

const layoutFile = 'src/components/Layout.tsx';
let content = fs.readFileSync(layoutFile, 'utf8');

const oldLogoBlockRegex = /<div\s+className="logo-expanded"[\s\S]*?<\/div>\s*<div\s+className="logo-collapsed"[\s\S]*?<\/div>/m;

const newLogoBlock = `<div 
              className="logo-expanded" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', alignItems: 'center', gap: '10px' }}
              title="Dashboard"
            >
              <Home size={32} strokeWidth={2} color="var(--primary-color)" />
            </div>
            <div 
              className="logo-collapsed" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', alignItems: 'center', justifyContent: 'center', width: '100%' }}
              title="Dashboard"
            >
              <Home size={32} strokeWidth={2} color="var(--primary-color)" />
            </div>`;

content = content.replace(oldLogoBlockRegex, newLogoBlock);

fs.writeFileSync(layoutFile, content, 'utf8');
console.log('Fixed double logo and removed CSCS text');
