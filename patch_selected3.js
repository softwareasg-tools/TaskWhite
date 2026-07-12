const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

const search = `    function syncCheckboxStyles() {`;
const replace = `    window.syncCheckboxStyles = function() {`;
content = content.replace(search, replace);

fs.writeFileSync(ejsPath, content);
console.log("Patched window.syncCheckboxStyles successfully!");
