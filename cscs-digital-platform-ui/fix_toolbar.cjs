const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Users.tsx";
let content = fs.readFileSync(path, "utf8");

const oldToolbar = `<div className="permissions-toolbar-bottom">
                        <button type="button" className="btn-link" onClick={handleSelectAll}>Select All</button>
                        <button type="button" className="btn-link" onClick={handleClearAll} style={{ color: 'var(--text-muted)' }}>Clear All</button>
                        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
                        <button type="button" className="btn-link" onClick={handleExpandAll} style={{ color: 'var(--text-muted)' }}>Expand All</button>
                        <button type="button" className="btn-link" onClick={handleCollapseAll} style={{ color: 'var(--text-muted)' }}>Collapse All</button>
                      </div>`;

// Since formatting might differ slightly (tabs/spaces), we'll use a regex
content = content.replace(
  /<div className="permissions-toolbar-bottom">([\s\S]*?)<\/div>/,
  `<div className="permissions-toolbar-bottom">
                        <button type="button" className="btn-link" onClick={handleSelectAll}>Select All / تحديد الكل</button>
                        <button type="button" className="btn-link" onClick={handleClearAll} style={{ color: 'var(--text-muted)' }}>Clear All / مسح الكل</button>
                      </div>`
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");
