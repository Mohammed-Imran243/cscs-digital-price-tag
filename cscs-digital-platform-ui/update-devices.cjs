const fs = require('fs');

const replacement = `      <PageToolbar>
        <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
          <div className="store-selector-wrapper">
            <StoreIcon size={16} className="text-muted" />
            <select 
              value={selectedStoreId} 
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="glass-select"
            >
              <option value="">{t('Select a Store...', 'اختر متجراً...')}</option>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName} {store.externalStoreId ? \`(\${store.externalStoreId})\` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search devices... / ابحث عن الأجهزة..."
          />
        </div>

        <ActionButtons
          onRefresh={() => fetchDevices()}
          loading={loading || storesLoading}
          onBatchBind={activeTab === 'esl' ? () => setShowEslImportExport(true) : undefined}
          onExport={activeTab === 'esl' ? async () => {
            try {
              await exportEslTags(selectedStoreId);
            } catch (e) {
              console.error('Export failed', e);
            }
          } : undefined}
          onAdd={activeTab === 'ap' ? () => setIsAddApModalOpen(true) : undefined}
          addLabel={activeTab === 'ap' ? 'Add AP' : 'Add'}
          addLabelAr={activeTab === 'ap' ? 'إضافة محطة' : 'إضافة'}
        >
          {activeTab === 'esl' && (
            <>
              <button 
                className="btn-action btn-action-bind" 
                onClick={() => {
                  setBindModalMode('bind');
                  setBindFormStoreId(selectedStoreId || stores[0]?.storeId || '');
                  setBindModalOpen(true);
                }}
                disabled={!selectedStoreId || storesLoading}
              >
                <Link2 /> {t('Bind', 'ربط')}
              </button>
              <button 
                className="btn-action btn-action-unbind" 
                onClick={() => {
                  setBindModalMode('unbind');
                  setBindFormStoreId(selectedStoreId || stores[0]?.storeId || '');
                  setBindModalOpen(true);
                }}
                disabled={!selectedStoreId || storesLoading}
              >
                <Link2 style={{ transform: 'rotate(90deg)' }} /> {t('Unbind', 'إلغاء ربط')}
              </button>
            </>
          )}
        </ActionButtons>
      </PageToolbar>`;

let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// I will extract the parts before and after the toolbar
const startIndex = content.indexOf('<PageToolbar>');
const endIndex = content.indexOf('</PageToolbar>') + '</PageToolbar>'.length;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync('src/pages/Devices.tsx', content);
    console.log('Successfully updated Devices.tsx');
} else {
    console.log('Could not find PageToolbar in Devices.tsx');
}
