const fs = require('fs');

// Fix Templates.tsx missing setIsStoreIconModalOpen
let templates = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// Insert the state variable next to isTemplateModalOpen
if (!templates.includes('const [isStoreIconModalOpen, setIsStoreIconModalOpen]')) {
  templates = templates.replace(
    'const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);',
    'const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);\n  const [isStoreIconModalOpen, setIsStoreIconModalOpen] = useState(false);'
  );
  fs.writeFileSync('src/pages/Templates.tsx', templates);
  console.log('Fixed Templates.tsx missing state');
}

// And check that it successfully replaced
if (templates.includes('const [isStoreIconModalOpen, setIsStoreIconModalOpen]')) {
  console.log('Templates.tsx is good');
} else {
  console.log('Failed to replace in Templates.tsx. Trying alternative replacement.');
  // If it didn't find the exact line, just insert it after the first useState
  templates = templates.replace(
    /const \[.*?\] = useState.*?;/,
    match => match + '\n  const [isStoreIconModalOpen, setIsStoreIconModalOpen] = useState(false);'
  );
  fs.writeFileSync('src/pages/Templates.tsx', templates);
}
