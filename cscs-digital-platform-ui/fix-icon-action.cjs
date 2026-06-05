const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

const regex = /\.icon-action \{[\s\S]*?\.icon-action\.danger:hover \{[\s\S]*?\}/m;

const newCss = `.icon-action {
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
}`;

content = content.replace(regex, newCss);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed icon-action block');
