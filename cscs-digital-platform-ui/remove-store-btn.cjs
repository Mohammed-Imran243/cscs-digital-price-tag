const fs = require('fs');

let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

const startIdx = content.indexOf('<div className="actions-row">');
if (startIdx !== -1) {
  // Find the closing </div> of actions-row
  const endIdx = content.indexOf('</div>', startIdx) + 6; // +6 for '</div>' length
  if (endIdx > startIdx) {
    // Delete the actions-row and the surrounding whitespace
    const toRemove = content.substring(startIdx, endIdx);
    content = content.replace(toRemove, '');
    fs.writeFileSync('src/pages/Templates.tsx', content);
    console.log("Successfully removed actions-row.");
  }
} else {
  console.log("actions-row not found.");
}
