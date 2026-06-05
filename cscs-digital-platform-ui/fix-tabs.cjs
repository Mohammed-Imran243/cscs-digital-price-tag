const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.template-tabs\s*\{[\s\S]*?\}/g, '');
content = content.replace(/\.template-tab\s*\{[\s\S]*?\}/g, '');
content = content.replace(/\.template-tab\.[a-z:\-]+\s*\{[\s\S]*?\}/g, '');
content = content.replace(/\.template-tab:hover\s*\{[\s\S]*?\}/g, '');
content = content.replace(/\.template-tab\.active::after\s*\{[\s\S]*?\}/g, '');

const newTabsCss = `
/* Segmented Control style tabs for Templates */
.template-tabs {
  display: inline-flex;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  margin-bottom: 24px;
  background: var(--bg-primary, #ffffff);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex-wrap: wrap;
}

.template-tab {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--border-color, #d1d5db);
  color: var(--text-secondary, #4b5563);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.template-tab:last-child {
  border-right: none;
}

.template-tab:hover {
  background: var(--bg-secondary, #f8fafc);
  color: var(--text-primary);
}

.template-tab.active {
  color: var(--primary-color) !important;
  background: rgba(59, 130, 246, 0.05);
  font-weight: 600;
}

.template-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary-color);
}

@media (max-width: 768px) {
  .template-tabs {
    display: flex;
  }
  .template-tab {
    flex: 1;
    border-right: none;
    border-bottom: 1px solid var(--border-color, #d1d5db);
  }
  .template-tab:last-child {
    border-bottom: none;
  }
}
`;

content += '\n' + newTabsCss;

fs.writeFileSync(file, content, 'utf8');
console.log('Appended segmented control tabs CSS');
