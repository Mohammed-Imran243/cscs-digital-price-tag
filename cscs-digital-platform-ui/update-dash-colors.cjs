const fs = require('fs');

const dashboardFile = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

// The current values in the file:
// Merchants: #10B981 (was Green, now wants Indigo #6366f1)
content = content.replace(
  /color="#10B981"\s+bgColor="rgba\(99,102,241,0\.15\)"\s+borderColor="#10B981"/,
  'color="#6366f1"\n            bgColor="rgba(99,102,241,0.15)"\n            borderColor="#6366F1"'
);

// Stores: #3B82F6 (was Blue, now wants Teal #14B8A6)
content = content.replace(
  /color="#3B82F6"\s+bgColor="rgba\(14,165,233,0\.15\)"\s+borderColor="#3B82F6"/,
  'color="#14b8a6"\n            bgColor="rgba(20,184,166,0.15)"\n            borderColor="#14B8A6"'
);
// Wait, the previous replacement for Stores in earlier script was:
// color="#0ea5e9" \n bgColor="rgba(14,165,233,0.15)" \n borderColor="#3B82F6"
content = content.replace(
  /color="#0ea5e9"\s+bgColor="rgba\(14,165,233,0\.15\)"\s+borderColor="#3B82F6"/,
  'color="#14b8a6"\n            bgColor="rgba(20,184,166,0.15)"\n            borderColor="#14B8A6"'
);

// Access Points: #8B5CF6 (was Purple/Violet, wants Violet #8B5CF6 - Keep as is)
content = content.replace(
  /color="#8b5cf6"\s+bgColor="rgba\(139,92,246,0\.15\)"\s+borderColor="#8B5CF6"/,
  'color="#8b5cf6"\n            bgColor="rgba(139,92,246,0.15)"\n            borderColor="#8B5CF6"'
);

// Templates: #F59E0B (was Amber, wants Gold #EAB308)
content = content.replace(
  /color="#f59e0b"\s+bgColor="rgba\(245,158,11,0\.15\)"\s+borderColor="#F59E0B"/,
  'color="#eab308"\n            bgColor="rgba(234,179,8,0.15)"\n            borderColor="#EAB308"'
);

// Products: #14b8a6 (was Teal, wants Orange #F97316)
content = content.replace(
  /color="#14b8a6"\s+bgColor="rgba\(20,184,166,0\.15\)"\s+borderColor="#14B8A6"/,
  'color="#f97316"\n            bgColor="rgba(249,115,22,0.15)"\n            borderColor="#F97316"'
);

// ESL Tags: #f97316 (was Orange, wants Green #10B981)
content = content.replace(
  /color="#f97316"\s+bgColor="rgba\(249,115,22,0\.15\)"\s+borderColor="#F97316"/,
  'color="#10b981"\n            bgColor="rgba(16,185,129,0.15)"\n            borderColor="#10B981"'
);

// But wait, my previous scripts might have left the file in a different state.
// Let's use a safer replacement strategy that matches the 'label=' line to find the right StatCard.
const safeReplace = (label, colorHex, r, g, b) => {
  const regex = new RegExp(`(<StatCard[^>]*label="${label}[^>]*?)\\s*color="[^"]*"\\s*bgColor="[^"]*"\\s*borderColor="[^"]*"`, 'g');
  content = content.replace(regex, `$1\n            color="${colorHex}"\n            bgColor="rgba(${r},${g},${b},0.15)"\n            borderColor="${colorHex}"`);
};

safeReplace('Merchants \/ O U,OOO O', '#6366f1', 99, 102, 241);
safeReplace('Stores \/ O U,U.OO OO', '#14b8a6', 20, 184, 166);
safeReplace('Access Points \/ U\+U,O O O U,U\^OU\^U,', '#8b5cf6', 139, 92, 246);
safeReplace('Templates \/ O U,U,U\^O U,O"', '#eab308', 234, 179, 8);
safeReplace('Products \/ O U,U.U\+OOO O', '#f97316', 249, 115, 22);
safeReplace('ESL Tags \/ O1U,O U.O O ESL', '#10b981', 16, 185, 129);

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Colors updated');
