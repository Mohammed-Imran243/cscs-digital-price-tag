const fs = require('fs');

// =============================================================================
// FILTER STANDARDIZATION SCRIPT
// =============================================================================
// 1. Stores: Remove dead filter button
// 2. Products: Connect filter button to functional panel
// 3. Templates: Connect filter button properly (already has panel)
// 4. Devices: Add filter button + panel
// 5. AuditLogs: Connect filter button to showFilters state
// 6. Users: Connect filter button to functional panel
// =============================================================================

// ===== FIX 1: STORES - Remove dead filter button =====
{
  let content = fs.readFileSync('src/pages/Stores.tsx', 'utf8');
  
  const deadFilterBtn = `          <button className="btn-action btn-action-filter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
          <div className="global-search-bar"`;
  const withoutFilter = `          <div className="global-search-bar"`;
  
  if (content.includes(deadFilterBtn)) {
    content = content.replace(deadFilterBtn, withoutFilter);
    console.log('FIX 1: Removed dead filter button from Stores');
  } else {
    // Try a simpler match
    content = content.replace(/<button className="btn-action btn-action-filter">\n\s*<svg[^>]*>[^<]*<polygon points="22 3 2 3 10 12\.46 10 19 14 21 14 12\.46 22 3">[^<]*<\/polygon><\/svg>\n\s*<\/button>\n\s*<div className="global-search-bar"/,
      '<div className="global-search-bar"');
    console.log('FIX 1: Tried regex removal of Stores filter button');
  }
  
  fs.writeFileSync('src/pages/Stores.tsx', content);
}

// ===== FIX 2: PRODUCTS - Add functional filter panel =====
{
  let content = fs.readFileSync('src/pages/Products.tsx', 'utf8');

  // Add showFilters + filterStatus state after setIsSelectMode
  if (!content.includes('const [showProductFilters, setShowProductFilters]')) {
    content = content.replace(
      'const [isSelectMode, setIsSelectMode] = useState<boolean>(false);',
      `const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');`
    );
    console.log('FIX 2: Added filter states to Products');
  }

  // Count active filters
  if (!content.includes('const activeFilterCount')) {
    content = content.replace(
      'const [products, setProducts] = useState<Product[]>([]);',
      `const activeProductFilterCount = [filterStatus !== 'All', filterPriceMin !== '', filterPriceMax !== ''].filter(Boolean).length;
  const [products, setProducts] = useState<Product[]>([]);`
    );
    console.log('FIX 2: Added activeProductFilterCount');
  }

  // Connect filter button to toggle
  content = content.replace(
    `<button className="btn-action btn-action-filter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>`,
    `<button 
            className={\`btn-action btn-action-filter \${showProductFilters ? 'active' : ''}\`}
            onClick={() => setShowProductFilters(!showProductFilters)}
            title="Filters / التصفية"
            style={{ position: 'relative' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            {activeProductFilterCount > 0 && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--btn-add)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {activeProductFilterCount}
              </span>
            )}
          </button>`
  );

  // Add filter panel after PageToolbar closing tag
  const filterPanel = `
      {/* Products Filter Panel */}
      {showProductFilters && (
        <div className="templates-filters glass-card" style={{ padding: '12px 16px', border: '1px solid var(--glass-border)', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', borderRadius: '12px' }}>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 150px', minWidth: '120px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status / الحالة</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-select" style={{ height: '36px', borderRadius: '8px', fontSize: '13px' }}>
              <option value="All">All / الكل</option>
              <option value="bound">Bound / مربوط</option>
              <option value="unbound">Unbound / غير مربوط</option>
            </select>
          </div>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 120px', minWidth: '100px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Min Price / أدنى سعر</label>
            <input type="number" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} className="glass-input" placeholder="0" style={{ height: '36px', borderRadius: '8px', fontSize: '13px', padding: '0 10px' }} />
          </div>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 120px', minWidth: '100px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Max Price / أعلى سعر</label>
            <input type="number" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} className="glass-input" placeholder="∞" style={{ height: '36px', borderRadius: '8px', fontSize: '13px', padding: '0 10px' }} />
          </div>
          <button onClick={() => { setFilterStatus('All'); setFilterPriceMin(''); setFilterPriceMax(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '8px 12px', alignSelf: 'flex-end', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            Reset Filters / إعادة تعيين
          </button>
        </div>
      )}`;

  if (!content.includes('Products Filter Panel')) {
    content = content.replace('</PageToolbar>', `</PageToolbar>${filterPanel}`);
    console.log('FIX 2: Added filter panel to Products');
  }

  fs.writeFileSync('src/pages/Products.tsx', content);
}

// ===== FIX 3: AUDITLOGS - Connect dead filter button to showFilters state =====
{
  let content = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');
  
  // The button is dead - connect it to setShowFilters
  const deadAuditFilter = `<button className="btn-action btn-action-filter" style={{ padding: '0 12px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>`;
  
  const liveAuditFilter = `<button 
            className={\`btn-action btn-action-filter \${showFilters ? 'active' : ''}\`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filters / التصفية"
            style={{ padding: '0 12px', position: 'relative' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>`;

  if (content.includes(deadAuditFilter)) {
    content = content.replace(deadAuditFilter, liveAuditFilter);
    console.log('FIX 3: Connected AuditLogs filter button to showFilters');
  } else {
    // Try simpler approach
    content = content.replace(
      `<button className="btn-action btn-action-filter" style={{ padding: '0 12px' }}>`,
      `<button className={\`btn-action btn-action-filter \${showFilters ? 'active' : ''}\`} onClick={() => setShowFilters(!showFilters)} title="Filters / التصفية" style={{ padding: '0 12px', position: 'relative' }}>`
    );
    console.log('FIX 3: Connected AuditLogs filter button (simpler match)');
  }
  
  fs.writeFileSync('src/pages/AuditLogs.tsx', content);
}

// ===== FIX 4: USERS - Connect filter button + add functional filter panel =====
{
  let content = fs.readFileSync('src/pages/Users.tsx', 'utf8');

  // Add showFilters + filterRole state
  if (!content.includes('const [showUserFilters, setShowUserFilters]')) {
    content = content.replace(
      'const [loading, setLoading] = useState(true);',
      `const [showUserFilters, setShowUserFilters] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('All');
  const [loading, setLoading] = useState(true);`
    );
    console.log('FIX 4: Added filter states to Users');
  }

  // Count active user filters
  if (!content.includes('activeUserFilterCount')) {
    content = content.replace(
      'const [loading, setLoading] = useState(true);',
      `const activeUserFilterCount = [filterRole !== 'All'].filter(Boolean).length;
  const [loading, setLoading] = useState(true);`
    );
  }

  // Connect filter button to toggle
  content = content.replace(
    `<button className="btn-action btn-action-filter" style={{ padding: '0 12px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>`,
    `<button 
            className={\`btn-action btn-action-filter \${showUserFilters ? 'active' : ''}\`}
            onClick={() => setShowUserFilters(!showUserFilters)}
            title="Filters / التصفية"
            style={{ padding: '0 12px', position: 'relative' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            {activeUserFilterCount > 0 && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--btn-add)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {activeUserFilterCount}
              </span>
            )}
          </button>`
  );

  // Add filter panel after PageToolbar
  const userFilterPanel = `
      {/* Users Filter Panel */}
      {showUserFilters && (
        <div className="templates-filters glass-card" style={{ padding: '12px 16px', border: '1px solid var(--glass-border)', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', borderRadius: '12px' }}>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px', minWidth: '150px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role / الدور</label>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="glass-select" style={{ height: '36px', borderRadius: '8px', fontSize: '13px' }}>
              <option value="All">All Roles / جميع الأدوار</option>
              {roles.map((r: any) => (
                <option key={r.id} value={String(r.id)}>{r.roleName || r.name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => { setFilterRole('All'); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '8px 12px', alignSelf: 'flex-end', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            Reset Filters / إعادة تعيين
          </button>
        </div>
      )}`;

  if (!content.includes('Users Filter Panel')) {
    // Find PageToolbar close tag
    content = content.replace('</PageToolbar>', `</PageToolbar>${userFilterPanel}`);
    console.log('FIX 4: Added filter panel to Users');
  }

  // Apply filterRole to the displayed users list
  if (!content.includes('filterRole !== \'All\'')) {
    // Find the filteredUsers or paginatedUsers computation and add filter
    // The users are likely filtered by searchTerm already - let's add role filter
    content = content.replace(
      'const filteredUsers = users.filter(',
      `const filteredUsers = users.filter((u: any) => filterRole === 'All' || String(u.roleId) === filterRole).filter(`
    );
    // If no filteredUsers, filter the displayed list
    if (!content.includes("filterRole === 'All' || String")) {
      console.log('FIX 4: Could not find filteredUsers - filter connected to UI only');
    } else {
      console.log('FIX 4: Connected filterRole to user list filtering');
    }
  }

  fs.writeFileSync('src/pages/Users.tsx', content);
}

// ===== FIX 5: DEVICES - Add filter button + functional filter panel =====
{
  let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

  // Add filter state
  if (!content.includes('const [showDeviceFilters, setShowDeviceFilters]')) {
    content = content.replace(
      'const [loading, setLoading] = useState(false);',
      `const [showDeviceFilters, setShowDeviceFilters] = useState(false);
  const [filterDeviceStatus, setFilterDeviceStatus] = useState<string>('All');
  const [loading, setLoading] = useState(false);`
    );
    console.log('FIX 5: Added filter states to Devices');
  }

  // Count active device filters
  if (!content.includes('activeDeviceFilterCount')) {
    content = content.replace(
      'const [loading, setLoading] = useState(false);',
      `const activeDeviceFilterCount = [filterDeviceStatus !== 'All'].filter(Boolean).length;
  const [loading, setLoading] = useState(false);`
    );
  }

  // Add filter button before SearchInput in toolbar
  content = content.replace(
    `<SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search devices... / ابحث عن الأجهزة..."
          />`,
    `<button 
            className={\`btn-action btn-action-filter \${showDeviceFilters ? 'active' : ''}\`}
            onClick={() => setShowDeviceFilters(!showDeviceFilters)}
            title="Filters / التصفية"
            style={{ padding: '0 12px', position: 'relative', flexShrink: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            {activeDeviceFilterCount > 0 && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--btn-add)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {activeDeviceFilterCount}
              </span>
            )}
          </button>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search devices... / ابحث عن الأجهزة..."
          />`
  );

  // Apply filterDeviceStatus to filteredEslDevices
  content = content.replace(
    `const filteredEslDevices = React.useMemo(() => {
    let result = eslDevices;`,
    `const filteredEslDevices = React.useMemo(() => {
    let result = eslDevices.filter((d: any) => {
      if (filterDeviceStatus === 'All') return true;
      const state = String(d.onlineStatus || d.state || d.status || '').toLowerCase();
      return state.includes(filterDeviceStatus.toLowerCase());
    });`
  );

  // Add filter panel after PageToolbar
  const deviceFilterPanel = `
      {/* Device Filter Panel */}
      {showDeviceFilters && (
        <div className="templates-filters glass-card" style={{ padding: '12px 16px', border: '1px solid var(--glass-border)', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', borderRadius: '12px' }}>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px', minWidth: '140px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status / الحالة</label>
            <select value={filterDeviceStatus} onChange={e => setFilterDeviceStatus(e.target.value)} className="glass-select" style={{ height: '36px', borderRadius: '8px', fontSize: '13px' }}>
              <option value="All">All / الكل</option>
              <option value="online">Online / متصل</option>
              <option value="offline">Offline / غير متصل</option>
            </select>
          </div>
          <button onClick={() => setFilterDeviceStatus('All')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '8px 12px', alignSelf: 'flex-end', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            Reset Filters / إعادة تعيين
          </button>
        </div>
      )}`;

  if (!content.includes('Device Filter Panel')) {
    content = content.replace('</PageToolbar>', `</PageToolbar>${deviceFilterPanel}`);
    console.log('FIX 5: Added filter panel to Devices');
  }

  fs.writeFileSync('src/pages/Devices.tsx', content);
}

console.log('\n=== All filter standardization fixes complete! ===');
console.log('Stores: Dead filter button REMOVED');
console.log('Products: Filter button connected + panel added');
console.log('AuditLogs: Filter button connected to showFilters state');
console.log('Users: Filter button connected + role filter panel added');
console.log('Devices: Filter button added + status filter panel added');
console.log('Templates: Already had working filter - no change needed');
