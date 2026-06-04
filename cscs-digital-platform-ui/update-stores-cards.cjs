const fs = require('fs');
let code = fs.readFileSync('src/pages/Stores.tsx', 'utf8');

// 1. Update line clamp
code = code.replace(/<h3>\{store\.storeName\}<\/h3>/, '<h3 className="line-clamp-2" style={{ minHeight: \'44px\', marginBottom: \'8px\' }}>{store.storeName}</h3>');

// 2. Update buttons
const buttonsPattern = /<div className="store-card-actions">[\s\S]*?<\/div>\s*<\/div>/;
const newButtons = `<div className="store-card-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)', marginTop: '8px' }}>
                  <button className="btn-action btn-action-blue" style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }} onClick={() => openEditModal(store)}>
                    <Edit2 size={14} /> Edit
                  </button>
                  {store.status === 'ACTIVE' ? (
                    <button className="btn-action btn-action-slate" style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }} onClick={() => store.storeId && handleDisable(store.storeId)}>
                      <Power size={14} /> Disable
                    </button>
                  ) : (
                    <button className="btn-action btn-action-slate" style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }} onClick={() => store.storeId && handleEnable(store.storeId)}>
                      <CheckCircle size={14} /> Enable
                    </button>
                  )}
                  <button className="btn-action btn-action-red" style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }} onClick={() => store.storeId && handleDelete(store.storeId)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>`;

code = code.replace(buttonsPattern, newButtons);

fs.writeFileSync('src/pages/Stores.tsx', code);
