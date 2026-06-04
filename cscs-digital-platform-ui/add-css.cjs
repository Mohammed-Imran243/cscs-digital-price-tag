const fs = require('fs');

const css = `
/* Action Button Base */
.btn-action {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  padding: 0 16px !important;
  height: 42px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid transparent !important;
}

.btn-action svg {
  width: 18px !important;
  height: 18px !important;
}

.btn-action:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.btn-action:active {
  transform: translateY(1px) !important;
}

.btn-action:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Refresh = Blue */
.btn-action-refresh { background-color: #3b82f6 !important; color: white !important; }
.btn-action-refresh:hover { background-color: #2563eb !important; }

/* Add/Create = Purple */
.btn-action-add { background-color: #8b5cf6 !important; color: white !important; }
.btn-action-add:hover { background-color: #7c3aed !important; }

/* Import = Green */
.btn-action-import { background-color: #10b981 !important; color: white !important; }
.btn-action-import:hover { background-color: #059669 !important; }

/* Export = Orange */
.btn-action-export { background-color: #f97316 !important; color: white !important; }
.btn-action-export:hover { background-color: #ea580c !important; }

/* Bind = Indigo */
.btn-action-bind { background-color: #6366f1 !important; color: white !important; }
.btn-action-bind:hover { background-color: #4f46e5 !important; }

/* Unbind = Amber */
.btn-action-unbind { background-color: #f59e0b !important; color: white !important; }
.btn-action-unbind:hover { background-color: #d97706 !important; }

/* Batch Bind = Teal */
.btn-action-batch { background-color: #14b8a6 !important; color: white !important; }
.btn-action-batch:hover { background-color: #0d9488 !important; }

/* Delete = Red */
.btn-action-delete { background-color: #ef4444 !important; color: white !important; }
.btn-action-delete:hover { background-color: #dc2626 !important; }

/* Filter = Slate */
.btn-action-filter { background-color: #64748b !important; color: white !important; }
.btn-action-filter:hover { background-color: #475569 !important; }
`;

let content = fs.readFileSync('src/styles/theme.css', 'utf8');
content = content.replace(/\/\* Global Premium Secondary\/Refresh Button Styles \*\//, css + '\n\n/* Global Premium Secondary/Refresh Button Styles */');
fs.writeFileSync('src/styles/theme.css', content);
