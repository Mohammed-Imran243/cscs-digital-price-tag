const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

const newCSS = `

.template-tabs {
  display: flex;
  border-bottom: 1px solid var(--glass-border, #d1d5db);
  margin-bottom: 20px;
}

.template-tab {
  padding: 12px 24px;
  border: 1px solid var(--glass-border, #d1d5db);
  background: var(--glass-card, #f8fafc);
  color: var(--text-secondary, #4b5563);
  cursor: pointer;
  font-weight: 600;
  border-radius: 8px 8px 0 0;
  margin-right: 4px;
  margin-bottom: -1px;
  border-bottom-color: transparent;
  transition: all 0.2s ease;
}

.template-tab:hover:not(.active) {
  background: var(--bg-accent, #e2e8f0);
  color: var(--text-primary, #1f2937);
}

.template-tab.active {
  background: var(--primary-color, #3b82f6);
  color: #ffffff;
  border-color: var(--primary-color, #3b82f6);
  border-bottom-color: var(--primary-color, #3b82f6);
}
`;

fs.writeFileSync(file, content + newCSS, 'utf8');
console.log('CSS Appended');
