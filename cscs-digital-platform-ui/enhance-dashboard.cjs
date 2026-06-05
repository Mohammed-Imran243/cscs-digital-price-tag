const fs = require('fs');

const dashboardFile = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

// 1. Update StatCard interface
content = content.replace(
  /loading\?: boolean;\s+color\?: string;\s+bgColor\?: string;\s+error\?: boolean;\s+onClick\?: \(\) => void;\s+\}> = \(\{ icon, label, value, trend, loading, color = 'var\(--primary-color\)', bgColor = 'rgba\(99,102,241,0\.15\)', error, onClick \}\) => \(/,
  `loading?: boolean;
    color?: string;
    bgColor?: string;
    borderColor?: string;
    error?: boolean;
    onClick?: () => void;
  }> = ({ icon, label, value, trend, loading, color = 'var(--primary-color)', bgColor = 'rgba(99,102,241,0.15)', borderColor, error, onClick }) => (`
);

// 2. Update StatCard div
content = content.replace(
  /<div className=\{\`stat-card glass-card \$\{onClick \? 'clickable' : ''\}\`\} onClick=\{onClick\} style=\{\{ cursor: onClick \? 'pointer' : 'default' \}\}>/,
  `<div className={\`stat-card glass-card \${onClick ? 'clickable' : ''}\`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', '--accent-border': borderColor || color } as React.CSSProperties}>`
);

// 3. Update CSS for .stat-card
content = content.replace(
  /\.stat-card \{\s+padding: var\(--space-lg, 24px\) 28px;/,
  `.stat-card {\n          position: relative;\n          overflow: hidden;\n          padding: var(--space-lg, 24px) 28px;`
);

content = content.replace(
  /\.stat-card:hover \{\s+transform: translateY\(-3px\);\s+box-shadow: 0 12px 32px rgba\(0,0,0,0\.15\);\s+\}/,
  `.stat-card::before {\n          content: '';\n          position: absolute;\n          top: 0;\n          bottom: 0;\n          left: 0;\n          width: 5px;\n          background-color: var(--accent-border);\n          border-top-left-radius: 12px;\n          border-bottom-left-radius: 12px;\n        }\n        .stat-card:hover {\n          transform: translateY(-3px);\n          box-shadow: 0 8px 24px rgba(0,0,0,0.08);\n        }`
);

// 4. Update invocations
content = content.replace(
  /(<StatCard\s+icon=\{<Store size=\{24\} \/>\}\s+label="Merchants \/ [^"]+"\s+value=\{formatCount\(summary\?\.activeMerchantCount\)\}\s+trend=\{[^\}]+\}\s+loading=\{loading\})\s*\/>/,
  `$1 borderColor="#10B981" />`
);

content = content.replace(
  /(<StatCard\s+icon=\{<Store size=\{24\} \/>\}\s+label="Stores \/ [^"]+"\s+value=\{formatCount\(summary\?\.storeCount\)\}\s+trend=\{[^\}]+\}\s+loading=\{loading\})\s*\/>/,
  `$1 borderColor="#3B82F6" />`
);

content = content.replace(
  /(<StatCard\s+icon=\{<Wifi size=\{24\} \/>\}\s+label="Access Points \/ [^"]+"\s+value=\{formatCount\(summary\?\.apCount\)\}\s+trend=\{[^\}]+\}\s+loading=\{loading\})\s*\/>/,
  `$1 borderColor="#8B5CF6" />`
);

content = content.replace(
  /(<StatCard\s+icon=\{<FileText size=\{24\} \/>\}\s+label="Templates \/ [^"]+"\s+value=\{formatCount\(summary\?\.templateCount\)\}\s+trend=\{[^\}]+\}\s+loading=\{loading\})\s*\/>/,
  `$1 borderColor="#F59E0B" />`
);

content = content.replace(
  /(<StatCard\s+icon=\{<Package size=\{24\} \/>\}\s+label="Products \/ [^"]+"\s+value=\{formatCount\(summary\?\.productCount\)\}\s+trend=\{`[^`]+`\}\s+loading=\{loading\})\s*\/>/,
  `$1 borderColor="#F97316" />`
);

content = content.replace(
  /(<StatCard\s+icon=\{<Wifi size=\{24\} \/>\}\s+label="ESL Tags \/ [^"]+"\s+value=\{formatCount\(summary\?\.eslCount\)\}\s+trend=\{[^\}]+\}\s+loading=\{loading\})\s*\/>/,
  `$1 borderColor="#14B8A6" />`
);

// 5. Update btn-refresh CSS
content = content.replace(
  /\.btn-refresh \{\s+display: flex;\s+align-items: center;\s+gap: 8px;\s+font-weight: 600;\s+transition: background 0\.2s;\s+\}\s+\.btn-refresh:hover \{ background: rgba\(99, 102, 241, 0\.25\); \}\s+\.btn-refresh:disabled \{ opacity: 0\.5; cursor: not-allowed; \}/,
  `.btn-refresh {\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          gap: 6px;\n          height: 36px;\n          padding: 0 16px;\n          background: #ffffff;\n          color: #3b82f6;\n          border: 1px solid #3b82f6;\n          border-radius: 9999px;\n          font-weight: 600;\n          font-size: 14px;\n          cursor: pointer;\n          transition: all 0.2s ease;\n        }\n        .btn-refresh:hover:not(:disabled) {\n          background: #eff6ff;\n          transform: translateY(-1px);\n          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);\n        }\n        .btn-refresh:active:not(:disabled) {\n          transform: translateY(0);\n          box-shadow: none;\n        }\n        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }`
);

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Successfully enhanced Dashboard UI');
