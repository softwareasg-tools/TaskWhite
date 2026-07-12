const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

const search = `  .task-selected {
    background-color: rgba(135, 206, 235, 0.2) !important;
  }`;
const replace = `  .task-selected {
    background-color: rgba(135, 206, 235, 0.2) !important;
    outline: 2px solid var(--bs-primary);
    outline-offset: -2px;
  }
  .task-selected td,
  .task-selected th {
    background-color: transparent !important;
    --bs-table-bg: transparent;
    --bs-table-accent-bg: transparent;
    --bs-table-striped-bg: transparent;
  }`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(ejsPath, content);
  console.log("Patched successfully!");
} else {
  console.log("Could not find search string.");
}
