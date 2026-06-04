const fs = require('fs');

function cleanAuditLogs() {
  let a = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');

  // Remove filter button
  a = a.replace(
    /\s*<button className="btn-action btn-action-filter" style=\{\{ padding: '0 12px' \}\}>[\s\S]*?<\/button>/,
    ''
  );

  // Remove the filter panel
  const startIdx = a.indexOf('{/* Collapsible Advanced Filter Panel */}');
  if (startIdx !== -1) {
    let depth = 0;
    let inBlock = false;
    let endIdx = -1;
    for (let i = startIdx; i < a.length; i++) {
      if (a.slice(i, i + 15) === '{showFilters &&') {
        inBlock = true;
      }
      if (inBlock) {
        if (a[i] === '{') depth++;
        if (a[i] === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
    }
    if (endIdx !== -1) {
      a = a.slice(0, startIdx) + a.slice(endIdx);
    }
  }
  
  fs.writeFileSync('src/pages/AuditLogs.tsx', a);
  console.log('Removed filter button and panel from AuditLogs.tsx');
}

cleanAuditLogs();
