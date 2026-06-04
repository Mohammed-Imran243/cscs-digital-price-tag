const fs = require('fs');
let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Change default tab to 'store' if it was 'merchant'
content = content.replace("const activeMenuTab = query.get('tab') || 'merchant';", "const activeMenuTab = query.get('tab') || 'store';");

// 2. Remove Merchant Template text from breadcrumb
content = content.replace("{activeMenuTab === 'merchant' && 'Merchant Template / قوالب التاجر'}", "");

// 3. Remove Merchant Template tab button
const merchantTabBtnRegex = /<button[^>]*onClick=\{\(\) => navigate\('\/templates\?tab=merchant'\)\}[^>]*>\s*Merchant Template \/ قوالب التاجر\s*<\/button>/;
content = content.replace(merchantTabBtnRegex, '');

// 4. Remove SECTION 1: MERCHANT TEMPLATES entirely
// It starts at {/* ================= SECTION 1: MERCHANT TEMPLATES ================= */} and ends at {/* ================= SECTION 2: STORE TEMPLATES ================= */}
const merchantSectionRegex = /\{\/\* ================= SECTION 1: MERCHANT TEMPLATES ================= \*\/\}[\s\S]*?(?=\{\/\* ================= SECTION 2: STORE TEMPLATES ================= \*\/)/;
content = content.replace(merchantSectionRegex, '');

// The user also mentioned adding the "Store Icon" tab button if it's missing from the tabs. 
// I see in the previous output:
// {activeMenuTab === 'store_icon' && 'Store Icon / أيقونة المتجر'}
// Let's check if the button for it exists in workspace-tabs. It does NOT in my previous inject!
const storeIconBtnHtml = `
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'store_icon' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'store_icon' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=store_icon')}
          >
            Store Icon / أيقونة المتجر
          </button>`;
// Add it after Store Template button
const storeTabBtnRegex = /(<button[^>]*onClick=\{\(\) => navigate\('\/templates\?tab=store'\)\}[^>]*>\s*Store Template \/ قوالب المتجر\s*<\/button>)/;
content = content.replace(storeTabBtnRegex, '$1\n' + storeIconBtnHtml);

fs.writeFileSync('src/pages/Templates.tsx', content);
