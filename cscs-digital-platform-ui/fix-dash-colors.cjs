const fs = require('fs');

const dashboardFile = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

const replaceCardColors = (labelPattern, color, rgba) => {
  const regex = new RegExp(`(<StatCard[\\s\\S]*?label="${labelPattern}"[\\s\\S]*?loading=\\{loading\\})[\\s\\S]*?(<StatCard|<\\/div>)`);
  content = content.replace(regex, (match, p1, p2) => {
    return `${p1}\n            color="${color}"\n            bgColor="${rgba}"\n            borderColor="${color}"\n          />\n          ${p2}`;
  });
};

replaceCardColors('Merchants / [^"]+', '#6366f1', 'rgba(99,102,241,0.15)'); // Indigo
replaceCardColors('Stores / [^"]+', '#14b8a6', 'rgba(20,184,166,0.15)'); // Teal
replaceCardColors('Access Points / [^"]+', '#8b5cf6', 'rgba(139,92,246,0.15)'); // Violet
replaceCardColors('Templates / [^"]+', '#eab308', 'rgba(234,179,8,0.15)'); // Gold
replaceCardColors('Products / [^"]+', '#f97316', 'rgba(249,115,22,0.15)'); // Orange
replaceCardColors('ESL Tags / [^"]+', '#10b981', 'rgba(16,185,129,0.15)'); // Green

// Let's do a more robust regex that just replaces the color lines directly within the StatCard block.
content = fs.readFileSync(dashboardFile, 'utf8');

const updateColor = (labelRegex, colorHex, r, g, b) => {
  const parts = content.split('<StatCard');
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].match(new RegExp(`label="${labelRegex}`))) {
      parts[i] = parts[i].replace(/color="[^"]+"/, `color="${colorHex}"`);
      parts[i] = parts[i].replace(/bgColor="[^"]+"/, `bgColor="rgba(${r},${g},${b},0.15)"`);
      parts[i] = parts[i].replace(/borderColor="[^"]+"/, `borderColor="${colorHex}"`);
    }
  }
  content = parts.join('<StatCard');
};

// Merchants -> Indigo (#6366f1)
updateColor('Merchants', '#6366f1', 99, 102, 241);

// Stores -> Teal (#14b8a6)
updateColor('Stores', '#14b8a6', 20, 184, 166);

// Access Points -> Violet (#8b5cf6)
updateColor('Access Points', '#8b5cf6', 139, 92, 246);

// Templates -> Gold (#eab308)
updateColor('Templates', '#eab308', 234, 179, 8);

// Products -> Orange (#f97316)
updateColor('Products', '#f97316', 249, 115, 22);

// ESL Tags -> Green (#10b981)
updateColor('ESL Tags', '#10b981', 16, 185, 129);

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Fixed dashboard colors perfectly');
