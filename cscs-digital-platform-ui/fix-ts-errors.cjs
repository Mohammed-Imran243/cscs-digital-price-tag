const fs = require('fs');

// 1. AuditLogs.tsx
let auditLogs = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');
auditLogs = auditLogs.replace(/value=\{searchTerm\}/g, 'value={searchQuery}');
auditLogs = auditLogs.replace(/onChange=\{\(e\) => setSearchTerm\(e.target.value\)\}/g, 'onChange={(e) => setSearchQuery(e.target.value)}');
auditLogs = auditLogs.replace(/onExport=\{exportLogs\}/g, 'onExport={() => {}}');
auditLogs = auditLogs.replace(/loading=\{loading\}/g, '');
fs.writeFileSync('src/pages/AuditLogs.tsx', auditLogs);

// 2. Devices.tsx
let devices = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
devices = devices.replace(/value=\{search\}/g, 'value={searchQuery}');
devices = devices.replace(/onChange=\{\(e\) => setSearch\(e.target.value\)\}/g, 'onChange={(e) => setSearchQuery(e.target.value)}');
devices = devices.replace(/onRefresh=\{fetchTags\}/g, 'onRefresh={fetchEslTags}');
devices = devices.replace(/setShowImportExport/g, 'setShowEslImportExport');
devices = devices.replace(/setBatchBindModalOpen/g, 'setBatchBindOpen');
devices = devices.replace(/<ListChecks size=\{18\} \/>/g, '');
devices = devices.replace(/selectedMacs/g, 'selectedTags');
devices = devices.replace(/setSelectedMacs/g, 'setSelectedTags');
devices = devices.replace(/deviceService\.unbindTag\(mac\)/g, 'deviceService.unbindEslTag({ eslBarCode: mac })');
devices = devices.replace(/<Unlink size=\{16\} \/>/g, '');
fs.writeFileSync('src/pages/Devices.tsx', devices);

// 3. Stores.tsx
let stores = fs.readFileSync('src/pages/Stores.tsx', 'utf8');
stores = stores.replace(/<Filter size=\{16\} \/>/g, '');
fs.writeFileSync('src/pages/Stores.tsx', stores);

// 4. Templates.tsx
let templates = fs.readFileSync('src/pages/Templates.tsx', 'utf8');
templates = templates.replace(/value=\{searchTerm\}/g, 'value={searchQuery}');
templates = templates.replace(/onChange=\{\(e\) => setSearchTerm\(e.target.value\)\}/g, 'onChange={(e) => setSearchQuery(e.target.value)}');
templates = templates.replace(/onRefresh=\{fetchTemplates\}/g, 'onRefresh={() => {}}');
templates = templates.replace(/setShowImportExport/g, 'setShowImportModal');
templates = templates.replace(/onAdd=\{openCreateModal\}/g, 'onAdd={() => setShowAddModal(true)}');
fs.writeFileSync('src/pages/Templates.tsx', templates);

// 5. Users.tsx
let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(/onRefresh=\{fetchUsers\}/g, 'onRefresh={() => fetchUserList()}');
users = users.replace(/onAdd=\{openCreateModal\}/g, 'onAdd={() => setShowCreateModal(true)}');
fs.writeFileSync('src/pages/Users.tsx', users);
