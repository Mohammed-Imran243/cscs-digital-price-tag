const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`.icon-action {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-action:hover {
  background: var(--bg-accent);
  color: var(--primary-color);
}
.icon-action.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}`,
`.icon-action {
  background: transparent;
  border: none;
  color: var(--primary-color);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-action:hover {
  background: rgba(59, 130, 246, 0.1);
}
.icon-action.danger {
  color: var(--danger-color);
}
.icon-action.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}`);

content = content.replace(
`.template-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #d1d5db);
  margin-bottom: 20px;
}`,
`.template-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--border-color, #d1d5db);
  margin-bottom: 20px;
}`);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed index.css successfully');
