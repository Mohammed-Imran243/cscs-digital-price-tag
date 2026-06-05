const fs = require('fs');
const file = 'src/pages/Templates.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<PageHeader\n          title="Template Management"\n          titleAr="إدارة القوالب"\n        />\n        <div style={{ fontSize: \'13px\', color: \'var(--text-muted)\', marginBottom: \'16px\' }}>\n          Templates &gt; <span style={{ color: \'var(--primary-color)\', fontWeight: 600 }}>\n            {false && \'Merchant Template / قوالب التاجر\'}\n            {activeMenuTab === \'store\' && \'Store Template / قوالب المتجر\'}\n            {activeMenuTab === \'store_icon\' && \'Store Icon / أيقونة المتجر\'}\n            {activeMenuTab === \'properties\' && \'Template Properties / خصائص القالب\'}\n          </span>\n        </div>',
  '<PageHeader\n          title="Store Management"\n          titleAr="إدارة المتجر"\n        />'
);

const oldTabs = `<div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--glass-card)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => navigate('/templates?tab=store')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
              background: activeMenuTab === 'store' ? 'var(--primary-color)' : 'transparent',
              color: activeMenuTab === 'store' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            Store Template / قوالب المتجر
          </button>
          <button
            onClick={() => navigate('/templates?tab=store_icon')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
              background: activeMenuTab === 'store_icon' ? 'var(--primary-color)' : 'transparent',
              color: activeMenuTab === 'store_icon' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            Store Icon / أيقونة المتجر
          </button>
          <button
            onClick={() => navigate('/templates?tab=properties')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
              background: activeMenuTab === 'properties' ? 'var(--primary-color)' : 'transparent',
              color: activeMenuTab === 'properties' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            Template Properties / خصائص القالب
          </button>
        </div>`;
const newTabs = `<div className="template-tabs">
          <button
            onClick={() => navigate('/templates?tab=store')}
            className={\`template-tab \${activeMenuTab === 'store' ? 'active' : ''}\`}
          >
            Store Template / قوالب المتجر
          </button>
          <button
            onClick={() => navigate('/templates?tab=store_icon')}
            className={\`template-tab \${activeMenuTab === 'store_icon' ? 'active' : ''}\`}
          >
            Store Icon / أيقونة المتجر
          </button>
          <button
            onClick={() => navigate('/templates?tab=properties')}
            className={\`template-tab \${activeMenuTab === 'properties' ? 'active' : ''}\`}
          >
            Template Properties / خصائص القالب
          </button>
        </div>`;
content = content.replace(oldTabs, newTabs);

const oldFilter = `<button 
              className={\`btn-action btn-action-slate \${showFilters ? 'active' : ''}\`} 
              onClick={() => setShowFilters(!showFilters)}
              title="Filters / التصفية"
              style={{ position: 'relative' }}
            >
              <Filter size={18} />
              {isFilterActive && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '1px solid var(--glass-border)'
                }} />
              )}
            </button>`;
const newFilter = `{activeMenuTab === 'store' && (
              <button 
                className={\`btn-action btn-action-slate \${showFilters ? 'active' : ''}\`} 
                onClick={() => setShowFilters(!showFilters)}
                title="Filters / التصفية"
                style={{ position: 'relative' }}
              >
                <Filter size={18} />
                {isFilterActive && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    border: '1px solid var(--glass-border)'
                  }} />
                )}
              </button>
            )}`;
content = content.replace(oldFilter, newFilter);

const oldSearch = `<div className="global-search-bar">
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Search templates... / ابحث عن القوالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>`;
const newSearch = `{activeMenuTab !== 'properties' && (
              <div className="global-search-bar">
                <Search size={16} className="text-muted" />
                <input
                  type="text"
                  placeholder="Search templates... / ابحث عن القوالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}`;
content = content.replace(oldSearch, newSearch);

fs.writeFileSync(file, content, 'utf8');
console.log('Modifications applied');
