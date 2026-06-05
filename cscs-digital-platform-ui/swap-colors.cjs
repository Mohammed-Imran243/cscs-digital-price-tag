const fs = require('fs');

const dashboardFile = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

// Change Products from Orange to Teal
content = content.replace(
  /color="#f97316"\s+bgColor="rgba\(249,115,22,0\.15\)"\s+borderColor="#F97316"/,
  'color="#14b8a6"\n            bgColor="rgba(20,184,166,0.15)"\n            borderColor="#14B8A6"'
);

// Change ESL Tags from Green/Teal to Orange
content = content.replace(
  /color="#10b981"\s+bgColor="rgba\(16,185,129,0\.15\)"\s+borderColor="#14B8A6"/,
  'color="#f97316"\n            bgColor="rgba(249,115,22,0.15)"\n            borderColor="#F97316"'
);

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Successfully swapped colors');
