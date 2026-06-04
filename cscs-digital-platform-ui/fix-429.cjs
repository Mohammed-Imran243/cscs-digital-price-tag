const fs = require('fs');

let content = fs.readFileSync('src/services/templateService.ts', 'utf8');

const regex = /\/\/\s*Enrich with modelId and color from getTemplateById[\s\S]*?contentData\.content = detailedContent;\s*\}/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync('src/services/templateService.ts', content);
  console.log("Successfully removed enrichment block.");
} else {
  console.log("Enrichment block not found!");
}
