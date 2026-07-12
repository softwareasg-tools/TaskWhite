const fs = require('fs');

// Fix 1: taskController.js
const tcPath = 'E:/Antigravity/TaskWhite/controllers/taskController.js';
let tcContent = fs.readFileSync(tcPath, 'utf8');

const tcSearch = `    // Auto-update status based on due date if it's not marked Completed
    if (updates.status !== 'Completed' && currentData.status !== 'Completed') {
      if (activeDueDate < todayStr) {
        updates.status = 'Overdue';
      } else if (updates.status === 'Overdue') {
        // If it was overdue but date pushed forward, revert to Assigned/In Progress
        updates.status = currentData.status === 'Overdue' ? 'Assigned' : currentData.status;
      }
    }`;

const tcReplace = `    // Auto-update status based on due date if it's not marked Completed
    const targetStatus = updates.status !== undefined ? updates.status : currentData.status;
    if (targetStatus !== 'Completed') {
      if (activeDueDate < todayStr && targetStatus === 'Assigned') {
        updates.status = 'Overdue';
      } else if (activeDueDate >= todayStr && targetStatus === 'Overdue') {
        // If it was overdue but date pushed forward, revert to Assigned
        updates.status = 'Assigned';
      }
    }`;

tcContent = tcContent.replace(tcSearch, tcReplace);
fs.writeFileSync(tcPath, tcContent);


// Fix 2: dashboard.ejs
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let ejsContent = fs.readFileSync(ejsPath, 'utf8');

const ejsSearch = `        const searchInput = document.getElementById('dashboardSearch');
        if (searchInput && searchInput.value.trim() !== '') {
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }`;

const ejsReplace = `        const searchInput = document.getElementById('dashboardSearch');
        if (searchInput && searchInput.value.trim() !== '') {
          searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }`;

ejsContent = ejsContent.replace(ejsSearch, ejsReplace);
fs.writeFileSync(ejsPath, ejsContent);

console.log("Patched successfully!");
