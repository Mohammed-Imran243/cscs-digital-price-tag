const fs = require('fs');

let c = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');

// 1. Remove useMemo filteredLogs entirely
const filteredLogsStart = c.indexOf('const filteredLogs = React.useMemo(() => {');
if (filteredLogsStart !== -1) {
  let depth = 0;
  let inBlock = false;
  let endIdx = -1;
  for (let i = filteredLogsStart; i < c.length; i++) {
    if (c.slice(i, i + 30) === 'const filteredLogs = React.use') {
      inBlock = true;
    }
    if (inBlock) {
      if (c[i] === '{') depth++;
      if (c[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
  }
  if (endIdx !== -1) {
    // Find the end of the line containing the closing bracket
    const lineEndIdx = c.indexOf('\n', endIdx);
    c = c.slice(0, filteredLogsStart) + c.slice(lineEndIdx !== -1 ? lineEndIdx + 1 : endIdx);
  }
}

// 2. Remove totalCount logic that used filteredLogs
c = c.replace(/setTotalCount\(filteredLogs\.length\);\n\s*const maxPage = Math\.max\(1, Math\.ceil\(filteredLogs\.length \/ pageSize\)\);\n\s*if \(currentPage > maxPage\) \{\n\s*setCurrentPage\(maxPage\);\n\s*\}/g, '');

// 3. Remove paginatedLogs entirely, we will just use `logs` which are already from the backend API
const paginatedStart = c.indexOf('const paginatedLogs = useMemo');
if (paginatedStart !== -1) {
  let depth = 0;
  let inBlock = false;
  let endIdx = -1;
  for (let i = paginatedStart; i < c.length; i++) {
    if (c.slice(i, i + 25) === 'const paginatedLogs = use') {
      inBlock = true;
    }
    if (inBlock) {
      if (c[i] === '{') depth++;
      if (c[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
  }
  if (endIdx !== -1) {
    const lineEndIdx = c.indexOf('\n', endIdx);
    c = c.slice(0, paginatedStart) + c.slice(lineEndIdx !== -1 ? lineEndIdx + 1 : endIdx);
  }
}

// 4. Update the table to render `logs` instead of `paginatedLogs`
c = c.replace(/paginatedLogs\.map/g, 'logs.map');
c = c.replace(/paginatedLogs\.length/g, 'logs.length');

// 5. Update pagination in fetchLogs
// Let's modify fetchLogs to request currentPage - 1 and pageSize
// Currently fetchLogs does: getAuditLogs(..., 0, 2000, ...)
c = c.replace(/getAuditLogs\([\s\S]*?\);/, `getAuditLogs(
        selectedStoreId,
        startDate,
        endDate,
        currentPage - 1, // backend is 0-indexed
        pageSize,
        selectedOperation === '' ? undefined : Number(selectedOperation),
        selectedStatus === '' ? undefined : Number(selectedStatus)
      );`);

// After getAuditLogs returns, it sets setLogs(response.content)
// We also need to setTotalCount(response.totalElements)
c = c.replace(/setLogs\(response\.content \|\| \[\]\);/, 'setLogs(response.content || []);\n      setTotalCount(response.totalElements || 0);');

// Make fetchLogs depend on currentPage and pageSize
c = c.replace(/useEffect\(\(\) => \{\n\s*fetchLogs\(\);\n\s*\}, \[selectedStoreId, startDate, endDate, selectedOperation, selectedStatus\]\);/, `useEffect(() => {
    fetchLogs();
  }, [selectedStoreId, startDate, endDate, selectedOperation, selectedStatus, currentPage, pageSize]);`);

fs.writeFileSync('src/pages/AuditLogs.tsx', c);
console.log('Task 6 completed: backend filtering wired up.');
