const fs = require('fs');
let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Add import
if (!content.includes('TemplateDesigner')) {
  content = content.replace('import React, { useState, useEffect, useMemo, useRef } from \'react\';', 
    'import React, { useState, useEffect, useMemo, useRef } from \'react\';\nimport { TemplateDesigner } from \'../components/designer/TemplateDesigner\';');
}

// 2. Replace addToDetailsModal state with designerModal
content = content.replace(/const \[addToDetailsModal[\s\S]*?\} \| null>\(null\);/, 
  'const [designerModal, setDesignerModal] = useState<{ template?: any; storeId?: string; } | null>(null);');

// 3. Replace handleOpenAddToDetails
content = content.replace(/const handleOpenAddToDetails = async \(template: Template\) => \{[\s\S]*?\/\/ ================================================================/,
  'const handleOpenAddToDetails = (template: Template) => {\n    setDesignerModal({ template, storeId: selectedStore || undefined });\n  };\n  // ================================================================');

// 4. In handleCreateStoreTemplate, transition to designerModal
content = content.replace(/setTemplateStep\(2\);\n\s*showNotification\('Template created! Now configure its details[\s\S]*?\);/, 
  'setDesignerModal({ template: { ...newTemplate, id: res.id }, storeId: selectedStore || undefined });\n      setIsTemplateModalOpen(false);');

// 5. Remove Step 2 HTML
const step2Start = content.indexOf('/* ⎯⎯⎯⎯ STEP 2: Full DragonESL-style Template Editor ⎯⎯⎯⎯ */');
const step2End = content.indexOf('})()}', step2Start);
if (step2Start > -1 && step2End > -1) {
  content = content.slice(0, step2Start) + 'null\n              /* End Step 2 removed */\n            ' + content.slice(step2End - 12);
}

// 6. Remove Modal 5 HTML and inject TemplateDesigner
const modal5Start = content.indexOf('{/* ================= MODAL DIALOG 5: ADD TO DETAILS ================= */}');
if (modal5Start > -1) {
  const newModal = `
      {/* ================= DESIGNER MODAL ================= */}
      {designerModal && (
        <TemplateDesigner
          initialTemplate={designerModal.template}
          storeId={designerModal.storeId}
          onClose={() => setDesignerModal(null)}
          onSave={async (data) => {
            setDesignerModal(null);
            fetchTemplatesList();
          }}
        />
      )}
  `;
  content = content.replace(/\{\/\* ================= MODAL DIALOG 5: ADD TO DETAILS ================= \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$)/, newModal);
}

fs.writeFileSync('src/pages/Templates.tsx', content);
console.log('Templates.tsx patched successfully.');
