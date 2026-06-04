const fs = require('fs');

// 1. Fix PageToolbar.tsx
let toolbar = fs.readFileSync('src/components/common/PageToolbar.tsx', 'utf8');
toolbar = toolbar.replace(/overflowY:\s*'hidden',?\s*/g, '');
fs.writeFileSync('src/components/common/PageToolbar.tsx', toolbar);

// 2. Fix userService.ts
let userService = fs.readFileSync('src/services/userService.ts', 'utf8');
userService = userService.replace(
  /listUsers:\s*async\s*\(\s*pageNum\s*=\s*1,\s*pageSize\s*=\s*10\s*\)\s*=>\s*\{/,
  "listUsers: async (pageNum = 1, pageSize = 10, storeId?: string) => {"
);
userService = userService.replace(
  /const response = await api\.get\(`\/users\?pageNum=\$\{pageNum\}&pageSize=\$\{pageSize\}`\);/,
  "const storeParam = storeId ? `&storeId=${storeId}` : '';\n    const response = await api.get(`/users?pageNum=${pageNum}&pageSize=${pageSize}${storeParam}`);"
);
fs.writeFileSync('src/services/userService.ts', userService);

// 3. Fix Users.tsx
let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');

// Add imports
if (!users.includes('import { storeService }')) {
  users = users.replace(
    "import { userService } from '../services/userService';",
    "import { userService } from '../services/userService';\nimport { storeService } from '../services/storeService';\nimport { StoreSelector } from '../components/common/StoreSelector';"
  );
} else if (!users.includes('import { StoreSelector }')) {
  users = users.replace(
    "import { userService } from '../services/userService';",
    "import { userService } from '../services/userService';\nimport { StoreSelector } from '../components/common/StoreSelector';"
  );
}

// Add state for stores
const stateHookPos = users.indexOf('const [activeTab, setActiveTab] = useState');
if (stateHookPos !== -1 && !users.includes('const [stores,')) {
  const newStates = `
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [storesLoading, setStoresLoading] = useState(false);
  
  useEffect(() => {
    const loadStores = async () => {
      setStoresLoading(true);
      try {
        const response = await storeService.getStores(0, 100);
        const storeList = response.content || response.list || response.data || [];
        setStores(storeList);
      } catch (err) {
        console.error('Failed to load stores for users', err);
      } finally {
        setStoresLoading(false);
      }
    };
    loadStores();
  }, []);
  
`;
  users = users.slice(0, stateHookPos) + newStates + users.slice(stateHookPos);
}

// Update fetchData to use selectedStore
users = users.replace(
  /const usersRes = await userService\.listUsers\(1, 100\);/g,
  "const usersRes = await userService.listUsers(1, 100, selectedStore);"
);

// Add StoreSelector to PageToolbar
const toolbarRegex = /<PageToolbar>\s*<div style=\{\{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' \}\}>/;
if (toolbarRegex.test(users) && !users.includes('<StoreSelector')) {
  users = users.replace(toolbarRegex, `<PageToolbar>
        <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
          <StoreSelector 
            stores={stores} 
            selectedStore={selectedStore} 
            onSelect={setSelectedStore} 
            loading={storesLoading} 
          />`);
}

// Ensure fetchData is called when selectedStore changes
if (!users.includes('useEffect(() => {\n    fetchData();\n  }, [activeTab, selectedStore]);')) {
  users = users.replace(
    /useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[activeTab\]\);/g,
    "useEffect(() => {\n    fetchData();\n  }, [activeTab, selectedStore]);"
  );
}

fs.writeFileSync('src/pages/Users.tsx', users);

console.log("Fixes applied.");
