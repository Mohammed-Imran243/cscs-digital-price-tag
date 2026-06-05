const fs = require('fs');

const layoutFile = 'src/components/Layout.tsx';
let content = fs.readFileSync(layoutFile, 'utf8');

const regex = /<div className="logo-expanded">[\s\S]*?<img src="\/cscs-logo\.svg"[\s\S]*?<\/div>\s*<div className="logo-collapsed">[\s\S]*?<img src="\/cscs-logo\.svg"[\s\S]*?<\/div>/m;

const newLogoBlock = `<div 
              className="logo-expanded" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              title="Dashboard"
            >
              <Home size={28} strokeWidth={2} color="var(--primary-color)" />
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>CSCS</span>
            </div>
            <div 
              className="logo-collapsed" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
              title="Dashboard"
            >
              <Home size={28} strokeWidth={2} color="var(--primary-color)" />
            </div>`;

content = content.replace(regex, newLogoBlock);

fs.writeFileSync(layoutFile, content, 'utf8');
console.log('Fixed logo successfully');
