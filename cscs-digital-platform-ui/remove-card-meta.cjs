const fs = require('fs');

const dashboardFile = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

// Remove Live product counts
content = content.replace(/<span className="card-meta">Live product counts [^<]+<\/span>/g, '');

// Remove Access Point coverage
content = content.replace(/<span className="card-meta">Access Point coverage [^<]+<\/span>/g, '');

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Successfully removed card-meta texts');
