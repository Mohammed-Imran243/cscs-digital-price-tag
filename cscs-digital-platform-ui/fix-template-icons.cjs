const fs = require('fs');
const file = 'src/pages/Templates.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure Edit2 is imported
if (content.includes('Edit,') && !content.includes('Edit2,')) {
    content = content.replace('Edit,', 'Edit, Edit2,');
}

// Replace Edit icons
content = content.replace(/<Edit size=\{1[46]\}\s*\/>/g, '<Edit2 size={16} />');

// Replace class names
content = content.replace(/className="icon-edit-btn"/g, 'className="icon-action"');
content = content.replace(/className="op-btn primary-text"/g, 'className="icon-action"');
content = content.replace(/className="op-btn danger-text"/g, 'className="icon-action danger"');

// What about op-btn disabled-text?
content = content.replace(/className="op-btn disabled-text"/g, 'className="icon-action" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed icons in Templates.tsx');
