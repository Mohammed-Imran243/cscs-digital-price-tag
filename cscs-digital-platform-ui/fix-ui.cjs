const fs = require('fs');

// 1. Add .icon-action to theme.css
let theme = fs.readFileSync('src/styles/theme.css', 'utf8');
if (!theme.includes('.icon-action')) {
  theme += `
/* Compact Icon Actions */
.icon-action {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-action:hover {
  background: var(--bg-accent);
  color: var(--text-primary);
}
.icon-action.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
`;
}

// 2. Fix Dark theme button colors
theme = theme.replace(/--btn-add-bg-dark: #3b82f6;/g, '--btn-add-bg-dark: #2563eb;');
theme = theme.replace(/--btn-import-bg-dark: #10b981;/g, '--btn-import-bg-dark: #059669;');
theme = theme.replace(/--btn-export-bg-dark: #f59e0b;/g, '--btn-export-bg-dark: #d97706;');
theme = theme.replace(/--btn-delete-bg-dark: #ef4444;/g, '--btn-delete-bg-dark: #dc2626;');

// 3. Global Filter Button size
if (!theme.includes('.btn-action-filter { width: 44px; height: 44px;')) {
  theme += `
/* Filter Button Fix */
.btn-action-filter {
  width: 44px !important;
  height: 44px !important;
  padding: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
`;
}

fs.writeFileSync('src/styles/theme.css', theme);
