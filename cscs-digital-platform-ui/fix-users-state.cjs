const fs = require('fs');

let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');

// If we haven't already injected the stores state
if (!users.includes('const [stores, setStores] = useState<any[]>')) {
  // Find a good place to inject the states, e.g. after const [loading, setLoading] = useState(true);
  const loadingStatePos = users.indexOf('const [loading, setLoading] = useState(true);');
  if (loadingStatePos !== -1) {
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
    users = users.slice(0, loadingStatePos) + newStates + users.slice(loadingStatePos);
    fs.writeFileSync('src/pages/Users.tsx', users);
    console.log('Successfully injected state to Users.tsx');
  } else {
    console.log('Could not find injection point');
  }
} else {
  console.log('State already injected');
}
