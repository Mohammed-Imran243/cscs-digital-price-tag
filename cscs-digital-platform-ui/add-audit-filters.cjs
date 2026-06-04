const fs = require('fs');

let content = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');

// 1. Add filter states
const stateSearchStr = "const [searchQuery, setSearchQuery] = useState('');";
const stateInsertIdx = content.indexOf(stateSearchStr);
if (stateInsertIdx === -1) throw new Error("Could not find searchQuery state");

const filterStates = `
  const [filterOperator, setFilterOperator] = useState('');
  const [filterBarcode, setFilterBarcode] = useState('');
  const [filterEslTag, setFilterEslTag] = useState('');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterEslModel, setFilterEslModel] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  const activeFilterCount = [
    filterOperator,
    filterBarcode,
    filterEslTag,
    filterProductName,
    filterEslModel,
    filterPriceMin,
    filterPriceMax,
    selectedOperation !== '',
    selectedStatus !== ''
  ].filter(Boolean).length;
`;
content = content.slice(0, stateInsertIdx) + filterStates + '\n  ' + content.slice(stateInsertIdx);

// 2. Add local filter logic
const filterLogicSearchStr = "if (debouncedSearchQuery) {";
const filterLogicInsertIdx = content.indexOf(filterLogicSearchStr);
if (filterLogicInsertIdx === -1) throw new Error("Could not find filter logic insert point");

const filterLogic = `
    if (filterOperator) {
      const v = filterOperator.toLowerCase();
      result = result.filter(log => (log.operator || 'System / النظام').toLowerCase().includes(v));
    }
    if (filterBarcode) {
      const v = filterBarcode.toLowerCase();
      result = result.filter(log => (log.itemBarCode || '').toLowerCase().includes(v));
    }
    if (filterEslTag) {
      const v = filterEslTag.toLowerCase();
      result = result.filter(log => (log.priceTagBarCode || '').toLowerCase().includes(v));
    }
    if (filterProductName) {
      const v = filterProductName.toLowerCase();
      result = result.filter(log => (log.itemName || '').toLowerCase().includes(v));
    }
    if (filterEslModel) {
      const v = filterEslModel.toLowerCase();
      result = result.filter(log => (log.model || '').toLowerCase().includes(v));
    }
    if (filterPriceMin !== '') {
      const min = parseFloat(filterPriceMin);
      if (!isNaN(min)) result = result.filter(log => parseFloat(log.price || '0') >= min);
    }
    if (filterPriceMax !== '') {
      const max = parseFloat(filterPriceMax);
      if (!isNaN(max)) result = result.filter(log => parseFloat(log.price || '0') <= max);
    }
    
    `;
content = content.slice(0, filterLogicInsertIdx) + filterLogic + content.slice(filterLogicInsertIdx);

// 3. Reset all filters including new ones in handleResetFilters
content = content.replace(
  "setSelectedStatus('');",
  `setSelectedStatus('');
    setFilterOperator('');
    setFilterBarcode('');
    setFilterEslTag('');
    setFilterProductName('');
    setFilterEslModel('');
    setFilterPriceMin('');
    setFilterPriceMax('');`
);

// 4. Add the button to the toolbar
content = content.replace(
  '<div className="global-search-bar" style={{ flex: 1, minWidth: \'var(--search-min-width)\' }}>',
  `<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className={\`btn-action btn-action-filter \${showFilters ? 'active' : ''}\`} 
            onClick={() => setShowFilters(!showFilters)}
            title="Filters / التصفية"
            style={{ padding: '0 12px', position: 'relative' }}
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--danger-color, #ef4444)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-primary, #0b0f19)'
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <div className="global-search-bar" style={{ flex: 1, minWidth: 'var(--search-min-width)' }}>`
);

// 5. Add the filter panel before the table
const panelHtml = `
      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Timestamp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date From / من تاريخ</label>
              <input type="date" value={startDate} onChange={handleStartDateChange} className="glass-input" style={{ height: '36px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date To / إلى تاريخ</label>
              <input type="date" value={endDate} onChange={handleEndDateChange} className="glass-input" style={{ height: '36px' }} />
            </div>
            
            {/* Operator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Operator / القائم بالإجراء</label>
              <input type="text" value={filterOperator} onChange={e => { setFilterOperator(e.target.value); setCurrentPage(1); }} placeholder="Search operator..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* Operation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Operation / العملية</label>
              <select value={selectedOperation} onChange={handleOperationChange} className="glass-select" style={{ height: '36px' }}>
                <option value="">All Operations / كل العمليات</option>
                <option value="1">Bind Tag / ربط الشاشة</option>
                <option value="2">Unbind Tag / إلغاء ربط الشاشة</option>
                <option value="3">Force Refresh / تحديث الشاشة فوراً</option>
                <option value="4">Product Change / تغيير المنتج</option>
                <option value="5">Template Change / تغيير القالب</option>
                <option value="13">Force LED Flash / وميض إضاءة LED</option>
                <option value="14">Smart Reissue / إعادة إصدار ذكي</option>
              </select>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status / الحالة</label>
              <select value={selectedStatus} onChange={handleStatusChange} className="glass-select" style={{ height: '36px' }}>
                <option value="">All Status / كل الحالات</option>
                <option value="2">Success / ناجح</option>
                <option value="7">Manual Retry / إعادة المحاولة يدوياً</option>
                <option value="3">Failed / فشل</option>
              </select>
            </div>

            {/* Barcode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Barcode / الباركود</label>
              <input type="text" value={filterBarcode} onChange={e => { setFilterBarcode(e.target.value); setCurrentPage(1); }} placeholder="Product barcode..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* ESL Tag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>ESL Tag / الشاشة</label>
              <input type="text" value={filterEslTag} onChange={e => { setFilterEslTag(e.target.value); setCurrentPage(1); }} placeholder="ESL MAC address..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* Product Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Product Name / اسم المنتج</label>
              <input type="text" value={filterProductName} onChange={e => { setFilterProductName(e.target.value); setCurrentPage(1); }} placeholder="Product name..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* ESL Model */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>ESL Model / الموديل</label>
              <input type="text" value={filterEslModel} onChange={e => { setFilterEslModel(e.target.value); setCurrentPage(1); }} placeholder="e.g. ZKC35V" className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* Price Range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Price Range / نطاق السعر</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={filterPriceMin} onChange={e => { setFilterPriceMin(e.target.value); setCurrentPage(1); }} placeholder="Min" className="glass-input" style={{ height: '36px', width: '50%' }} />
                <input type="number" value={filterPriceMax} onChange={e => { setFilterPriceMax(e.target.value); setCurrentPage(1); }} placeholder="Max" className="glass-input" style={{ height: '36px', width: '50%' }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
            <button onClick={handleResetFilters} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '8px 12px' }}>
              Reset Filters / إعادة تعيين
            </button>
            <button className="btn-primary" onClick={() => fetchLogs()} style={{ padding: '8px 24px', height: '36px' }}>
              Apply Filters / تطبيق
            </button>
          </div>
        </div>
      )}
`;

const panelInsertSearchStr = "{/* Main content display */}";
const panelInsertIdx = content.indexOf(panelInsertSearchStr);
if (panelInsertIdx === -1) throw new Error("Could not find panel insert point");

content = content.slice(0, panelInsertIdx) + panelHtml + '\n      ' + content.slice(panelInsertIdx);

fs.writeFileSync('src/pages/AuditLogs.tsx', content);
console.log('Successfully injected advanced filters into AuditLogs.tsx');
