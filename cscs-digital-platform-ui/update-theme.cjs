const fs = require('fs');
let code = fs.readFileSync('src/styles/theme.css', 'utf8');

// 1. Add tokens to :root
const rootTokens = `
  /* Global Component Widths & Spacing */
  --toolbar-control-height: 44px;
  --store-selector-width: 260px;
  --search-min-width: 320px;
  --filter-width: 44px;
  --action-button-height: 44px;
  --action-button-min-width: 130px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;

  /* Enterprise Design Tokens - Light */
  --btn-refresh: #4f8ce0;     /* Soft Blue */
  --btn-add: #8b62cc;         /* Soft Purple */
  --btn-import: #5ca173;      /* Soft Green */
  --btn-export: #e08b4f;      /* Soft Orange */
  --btn-delete: #e05e5e;      /* Soft Red */
  --btn-bind: #5e6be0;        /* Soft Indigo */
  --btn-unbind: #e0a94f;      /* Soft Amber */
  --btn-batch: #4fbab0;       /* Soft Teal */
  --btn-filter: #64748b;      /* Neutral Slate */

  --card-bg: #ffffff;
  --card-border: #e2e8f0;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.05);

  --table-header-bg: #f8fafc;
  --table-row-hover: #f1f5f9;

  --toolbar-bg: #ffffff;

  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-danger: #ef4444;
  --status-info: #3b82f6;

  --page-header-color: #0f172a;
  --secondary-text-color: #475569;

  --input-bg: #ffffff;
  --input-border: #cbd5e1;
  --input-focus: #3b82f6;
`;

code = code.replace(/:root\\s*\\{/, ':root {' + rootTokens);

// 2. Add tokens to dark mode
const darkTokens = `
  /* Enterprise Design Tokens - Dark */
  --btn-refresh: #3b82f6;
  --btn-add: #8b5cf6;
  --btn-import: #10b981;
  --btn-export: #f97316;
  --btn-delete: #ef4444;
  --btn-bind: #6366f1;
  --btn-unbind: #f59e0b;
  --btn-batch: #14b8a6;
  --btn-filter: #475569;

  --card-bg: #1e293b;
  --card-border: #334155;
  --card-shadow: 0 4px 6px rgba(0,0,0,0.3);

  --table-header-bg: #0f172a;
  --table-row-hover: #334155;

  --toolbar-bg: #1e293b;

  --status-success: #34d399;
  --status-warning: #fbbf24;
  --status-danger: #f87171;
  --status-info: #60a5fa;

  --page-header-color: #f8fafc;
  --secondary-text-color: #cbd5e1;

  --input-bg: #0f172a;
  --input-border: #334155;
  --input-focus: #3b82f6;
`;

code = code.replace(/\\[data-theme='dark'\\]\\s*\\{/, "[data-theme='dark'] {" + darkTokens);

// 3. Update Action Button base
const btnActionBase = \`
/* Action Button Base */
.btn-action {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: var(--space-sm) !important;
  padding: 0 var(--space-md) !important;
  height: var(--action-button-height) !important;
  min-width: var(--action-button-min-width) !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border: 1px solid transparent !important;
  color: #fff !important;
}

.btn-action .btn-label {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.2;
}

.btn-action svg {
  flex-shrink: 0;
  width: 18px !important;
  height: 18px !important;
}

.btn-action-refresh { background-color: var(--btn-refresh) !important; }
.btn-action-add { background-color: var(--btn-add) !important; }
.btn-action-import { background-color: var(--btn-import) !important; }
.btn-action-export { background-color: var(--btn-export) !important; }
.btn-action-delete, .btn-action-red { background-color: var(--btn-delete) !important; }
.btn-action-bind { background-color: var(--btn-bind) !important; }
.btn-action-unbind { background-color: var(--btn-unbind) !important; }
.btn-action-batch { background-color: var(--btn-batch) !important; }
.btn-action-filter, .btn-action-slate { background-color: var(--btn-filter) !important; }
\`;

code = code.replace(/\\/\\* Action Button Base \\*\\/[\\s\\S]*?\\.btn-action-filter[^}]+}/, btnActionBase);

fs.writeFileSync('src/styles/theme.css', code);
