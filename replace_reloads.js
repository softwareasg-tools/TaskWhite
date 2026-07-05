const fs = require('fs');
const path = require('path');

const dir = 'views/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ejs'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace standard window.location.reload()
  content = content.replace(/window\.location\.reload\(\);/g, "reloadWithSuccess('Action completed successfully!');");

  // Replace setTimeouts with reloads
  content = content.replace(/setTimeout\(\(\) => window\.location\.reload\(\),\s*\d+\);/g, "reloadWithSuccess('Action completed successfully!');");
  content = content.replace(/setTimeout\(\(\) => \{\s*window\.location\.reload\(\);\s*\}, \d+\);/g, "reloadWithSuccess('Action completed successfully!');");

  fs.writeFileSync(filePath, content);
});

console.log('Replaced reloads with success messages!');
