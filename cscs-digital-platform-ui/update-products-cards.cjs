const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// Replace grid styling
code = code.replace(
  /gridTemplateColumns: 'repeat\(auto-fill, minmax\(285px, 1fr\)\)'/,
  "gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'"
);

// We need to replace the store-card-actions div completely.
const actionStartTag = '<div className="store-card-actions"';
// Let's replace the content inside store-card-actions up to the closing </div>
const oldActionsPattern = /<div className="store-card-actions"[\s\S]*?<\/div>/g;

const newActions = `<div className="store-card-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)', marginTop: '8px' }}>
                <button 
                  className="btn-action btn-action-blue" 
                  onClick={() => handleEditProduct(product)}
                  style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  className="btn-action btn-action-slate" 
                  onClick={() => handleCopyProduct(product)}
                  style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }}
                >
                  <Copy size={14} /> Copy
                </button>
                <button 
                  className="btn-action btn-action-red" 
                  onClick={() => handleDeleteProduct(product)}
                  style={{ flex: 1, height: '32px', fontSize: '12px', padding: '0 8px' }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>`;

code = code.replace(oldActionsPattern, newActions);

// Update some font sizes and margins to make the card more compact
code = code.replace(/<h3 className="product-title-card" style={{ fontSize: '16px', fontWeight: '700'/g, '<h3 className="product-title-card" style={{ fontSize: "14px", fontWeight: "600"');
code = code.replace(/marginBottom: '12px', paddingLeft: '12px'/g, "marginBottom: '8px', paddingLeft: '8px'");

fs.writeFileSync('src/pages/Products.tsx', code);
