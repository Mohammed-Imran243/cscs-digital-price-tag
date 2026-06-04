const fs = require('fs');
function r(f, word) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(new RegExp('\\\\b' + word + '\\\\b,? *', 'g'), '');
  fs.writeFileSync(f, c);
}
r('src/components/dashboard/PriceChangeMonitor.tsx', 'Clock');
r('src/components/dashboard/PriceChangeMonitor.tsx', 'Store');
r('src/components/dashboard/PriceChangeMonitor.tsx', 'getRelativeTime');
r('src/components/devices/ApTab.tsx', 'getPaginationRange');
r('src/components/devices/EslTab.tsx', 'getPaginationRange');
r('src/pages/AuditLogs.tsx', 'RefreshCw');
r('src/pages/AuditLogs.tsx', 'Search');
r('src/pages/AuditLogs.tsx', 'getPaginationRange');
r('src/pages/AuditLogs.tsx', 'StatusBadge');
r('src/pages/Devices.tsx', 'Search');
r('src/pages/Products.tsx', 'Search');
r('src/pages/Products.tsx', 'Plus');
r('src/pages/Products.tsx', 'RefreshCw');
r('src/pages/Products.tsx', 'Upload');
r('src/pages/Products.tsx', 'Trash2');
r('src/pages/Products.tsx', 'getPaginationRange');
r('src/pages/Products.tsx', 'StatusBadge');
r('src/pages/Products.tsx', 'handleDeleteStoreOnly');
r('src/pages/Products.tsx', 'handleDeleteSelected');
r('src/pages/Stores.tsx', 'Plus');
r('src/pages/Stores.tsx', 'Search');
r('src/pages/Stores.tsx', 'RefreshCw');
r('src/pages/Stores.tsx', 'Upload');
r('src/pages/Stores.tsx', 'getPaginationRange');
r('src/pages/Users.tsx', 'RefreshCw');
r('src/pages/Users.tsx', 'getPaginationRange');
r('src/pages/Users.tsx', 'StatusBadge');

let s = fs.readFileSync('src/pages/Stores.tsx', 'utf8');
const imps = "import { importStores, exportStores, downloadStoreImportTemplate } from '../services/importExportService';";
s = s.split(imps).join('');
s = imps + '\n' + s;
fs.writeFileSync('src/pages/Stores.tsx', s);
