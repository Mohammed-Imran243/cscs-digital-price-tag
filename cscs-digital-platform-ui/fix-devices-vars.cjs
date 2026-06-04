const fs = require('fs');

let devices = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// Replace standard variables
devices = devices.replace(/value=\{search\}/g, 'value={searchQuery}');
devices = devices.replace(/onChange=\{\(e\) => setSearch\(e.target.value\)\}/g, 'onChange={(e) => setSearchQuery(e.target.value)}');
devices = devices.replace(/onRefresh=\{fetchTags\}/g, 'onRefresh={fetchEslTags}');
devices = devices.replace(/setShowImportExport/g, 'setShowEslImportExport');

// Fix Batch Bind button
devices = devices.replace(/onClick=\{\(\) => setBatchBindModalOpen\(true\)\}/g, 'onClick={() => setBindModalOpen(true)}');

// We have the bulk actions block in Devices.tsx which has selectedMacs etc. We'll replace them:
devices = devices.replace(/selectedMacs\.length/g, 'selectedTags.length');
devices = devices.replace(/for \(const mac of selectedMacs\)/g, 'for (const mac of selectedTags)');
devices = devices.replace(/deviceService\.unbindTag\(mac\)/g, 'deviceService.unbindEsl({ eslBarCode: mac })');
devices = devices.replace(/setSelectedMacs/g, 'setSelectedTags');
devices = devices.replace(/fetchTags\(\)/g, 'fetchEslTags()');

fs.writeFileSync('src/pages/Devices.tsx', devices);
