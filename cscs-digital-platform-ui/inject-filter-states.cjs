const fs = require('fs');

// Fix Products - inject states
{
  let content = fs.readFileSync('src/pages/Products.tsx', 'utf8');
  
  // The line uses useState(false) not useState<boolean>(false) and has \r ending
  const target = "const [isSelectMode, setIsSelectMode] = useState(false);";
  const replacement = `const [isSelectMode, setIsSelectMode] = useState(false);
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const activeProductFilterCount = [filterStatus !== 'All', filterPriceMin !== '', filterPriceMax !== ''].filter(Boolean).length;`;
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/Products.tsx', content);
    console.log('Products: states injected');
  } else {
    console.error('Products: could not find target - checking line endings...');
    const idx = content.indexOf('isSelectMode, setIsSelectMode');
    console.log('Found at char:', idx);
    console.log('Context:', JSON.stringify(content.slice(idx - 10, idx + 80)));
  }
}

// Fix Devices - inject states
{
  let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
  
  const target = "const [loading, setLoading] = useState(true);";
  const replacement = `const [loading, setLoading] = useState(true);
  const [showDeviceFilters, setShowDeviceFilters] = useState(false);
  const [filterDeviceStatus, setFilterDeviceStatus] = useState<string>('All');
  const activeDeviceFilterCount = [filterDeviceStatus !== 'All'].filter(Boolean).length;`;
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/Devices.tsx', content);
    console.log('Devices: states injected');
  } else {
    console.error('Devices: could not find target');
    const idx = content.indexOf('useState(true)');
    if (idx !== -1) {
      console.log('Context:', JSON.stringify(content.slice(idx - 30, idx + 60)));
    }
  }
}

// Fix Users - inject states
{
  let content = fs.readFileSync('src/pages/Users.tsx', 'utf8');
  
  if (!content.includes('const [showUserFilters, setShowUserFilters]')) {
    // Find the loading state
    const target = "const [loading, setLoading] = useState(true);";
    const replacement = `const [showUserFilters, setShowUserFilters] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('All');
  const activeUserFilterCount = [filterRole !== 'All'].filter(Boolean).length;
  const [loading, setLoading] = useState(true);`;
    
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync('src/pages/Users.tsx', content);
      console.log('Users: states injected');
    } else {
      const idx = content.indexOf('useState(true)');
      if (idx !== -1) {
        console.log('Users loading context:', JSON.stringify(content.slice(idx - 30, idx + 60)));
      }
    }
  } else {
    console.log('Users: states already injected');
  }
}
