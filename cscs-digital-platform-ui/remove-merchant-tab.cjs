const fs = require('fs');
let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Change default tab to 'store' if it was 'merchant'
content = content.replace(/const activeMenuTab = query\.get\('tab'\) \|\| 'merchant';/, "const activeMenuTab = query.get('tab') || 'store';");

// 2. Remove Merchant Template tab button
const merchantTabBtnRegex = /<button[\s\S]*?onClick=\{[\s\S]*?navigate\('\/templates\?tab=merchant'\)[\s\S]*?>[\s\S]*?Merchant Template \/ قوالب التاجر[\s\S]*?<\/button>/;
content = content.replace(merchantTabBtnRegex, '');

// 3. Add Store Icon tab button next to Store Template
const storeTabBtnRegex = /(<button[\s\S]*?onClick=\{[\s\S]*?navigate\('\/templates\?tab=store'\)[\s\S]*?>[\s\S]*?Store Template \/ قوالب المتجر[\s\S]*?<\/button>)/;
const storeIconBtnHtml = `
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'store_icon' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'store_icon' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=store_icon')}
          >
            Store Icon / أيقونة المتجر
          </button>`;
content = content.replace(storeTabBtnRegex, '$1' + storeIconBtnHtml);

// 4. Remove the Merchant Templates section entirely
const merchantSectionRegex = /\{\/\* ================= SECTION 1: MERCHANT TEMPLATES ================= \*\/\}[\s\S]*?\{activeMenuTab === 'merchant' && \([\s\S]*?<\/div>\n          \)\}/;
content = content.replace(merchantSectionRegex, '');

fs.writeFileSync('src/pages/Templates.tsx', content);
