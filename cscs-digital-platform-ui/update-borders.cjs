const fs = require('fs');

const dashboardFile = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

// Merchants
content = content.replace(
  /color="#6366f1"\s+bgColor="rgba\(99,102,241,0\.15\)"/,
  'color="#6366f1"\n            bgColor="rgba(99,102,241,0.15)"\n            borderColor="#10B981"'
);

// Stores
content = content.replace(
  /color="#0ea5e9"\s+bgColor="rgba\(14,165,233,0\.15\)"/,
  'color="#0ea5e9"\n            bgColor="rgba(14,165,233,0.15)"\n            borderColor="#3B82F6"'
);

// Access Points
content = content.replace(
  /color="#8b5cf6"\s+bgColor="rgba\(139,92,246,0\.15\)"/,
  'color="#8b5cf6"\n            bgColor="rgba(139,92,246,0.15)"\n            borderColor="#8B5CF6"'
);

// Templates
content = content.replace(
  /color="#f59e0b"\s+bgColor="rgba\(245,158,11,0\.15\)"/,
  'color="#f59e0b"\n            bgColor="rgba(245,158,11,0.15)"\n            borderColor="#F59E0B"'
);

// Products
content = content.replace(
  /color="#f97316"\s+bgColor="rgba\(249,115,22,0\.15\)"/,
  'color="#f97316"\n            bgColor="rgba(249,115,22,0.15)"\n            borderColor="#F97316"'
);

// ESL Tags
content = content.replace(
  /color="#10b981"\s+bgColor="rgba\(16,185,129,0\.15\)"/,
  'color="#10b981"\n            bgColor="rgba(16,185,129,0.15)"\n            borderColor="#14B8A6"'
);

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Successfully set borderColor on StatCards');
