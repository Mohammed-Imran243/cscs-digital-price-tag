const fs = require('fs');
let code = fs.readFileSync('src/styles/theme.css', 'utf8');

// 1. Add global table alignment standards
if (!code.includes('/* Global Enterprise Table Standards */')) {
  const tableStyles = `
/* Global Enterprise Table Standards */
table th, table td {
  text-align: left;
}

/* Center aligned elements */
.text-center, 
th:nth-child(2):has(span:contains("Status")), td:nth-child(2):has(.status-badge),
th:nth-last-child(2):has(span:contains("Status")), td:nth-last-child(2):has(.status-badge),
th:nth-child(n):has(span:contains("Role")), td:nth-child(n):has(.role-badge) {
  text-align: center !important;
}

/* Right aligned elements */
.text-right, 
th:nth-last-child(1), td:nth-last-child(1),
th:nth-child(n):has(span:contains("Price")), td:nth-child(n):has(.price) {
  text-align: right !important;
}

/* Re-adjust operations column if it's the last one but should be left/center */
th:nth-last-child(1):has(span:contains("Operation")), td:nth-last-child(1):has(.operation) {
  text-align: left !important;
}

table th {
  padding: var(--space-md) var(--space-lg);
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--card-border);
}

table td {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--card-border);
  vertical-align: middle;
}
`;
  code = code + '\n' + tableStyles;
}

fs.writeFileSync('src/styles/theme.css', code);
