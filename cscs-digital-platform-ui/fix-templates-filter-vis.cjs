const fs = require('fs');

let t = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

const regex = /<button[\s\S]*?className=\{`btn-action btn-action-slate \$\{showFilters \? 'active' : ''\}`\}[\s\S]*?onClick=\{\(\) => setShowFilters\(!showFilters\)\}[\s\S]*?title="Filters \/ التصفية"[\s\S]*?style=\{\{ position: 'relative' \}\}[\s\S]*?>[\s\S]*?<Filter size=\{18\} \/>[\s\S]*?\{isFilterActive && \([\s\S]*?<span style=\{\{[\s\S]*?position: 'absolute',[\s\S]*?top: '4px',[\s\S]*?right: '4px',[\s\S]*?width: '6px',[\s\S]*?height: '6px',[\s\S]*?borderRadius: '50%',[\s\S]*?backgroundColor: '#3b82f6',[\s\S]*?border: '1px solid var\(--glass-border\)'[\s\S]*?\}\} \/>[\s\S]*?\}\)[\s\S]*?<\/button>/m;

if (regex.test(t)) {
  t = t.replace(regex, (match) => `{activeMenuTab === 'store' && (\n${match}\n)}`);
  fs.writeFileSync('src/pages/Templates.tsx', t);
  console.log('Successfully wrapped filter button in Templates.tsx');
} else {
  console.log('Failed to match filter button block via regex');
  
  // Try line by line replacement
  const lines = t.split('\n');
  const outLines = [];
  let inButton = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('btn-action btn-action-slate') && line.includes('showFilters')) {
      outLines.push('          {activeMenuTab === \'store\' && (');
      inButton = true;
    }
    
    outLines.push(line);
    
    if (inButton && line.includes('</button>')) {
      outLines.push('          )}');
      inButton = false;
    }
  }
  
  fs.writeFileSync('src/pages/Templates.tsx', outLines.join('\n'));
  console.log('Used line-by-line replacement for Templates.tsx');
}
