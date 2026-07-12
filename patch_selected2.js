const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

// 1. Fix spacebar event bubbling
const spaceSearch = `cb.dispatchEvent(new Event('change'));`;
const spaceReplace = `cb.dispatchEvent(new Event('change', { bubbles: true }));`;
content = content.replace(spaceSearch, spaceReplace);

// 2. Fix checkboxes on page load
const loadSearch = `    // Checkbox highlighting logic
    document.addEventListener('change', (e) => {`;
const loadReplace = `    // Checkbox highlighting logic
    function syncCheckboxStyles() {
      document.querySelectorAll('.row-checkbox').forEach(cb => {
        const row = cb.closest('.dashboard-task-row');
        if (row) {
          if (cb.checked) row.classList.add('task-selected');
          else row.classList.remove('task-selected');
        }
      });
    }
    syncCheckboxStyles();

    document.addEventListener('change', (e) => {`;
content = content.replace(loadSearch, loadReplace);

// 3. Fix checkboxes on table refresh
const refreshSearch = `          setTimeout(() => {
            showToast(taskIds.length > 1 ? \`\${taskIds.length} tasks marked completed!\` : 'Task status updated!', 'success');
            sessionStorage.setItem('completedTasksHighlight', JSON.stringify(taskIds));
            refreshDashboardTable();
          }, 1000);`;
// Wait, refreshDashboardTable doesn't call syncCheckboxStyles. I should just inject syncCheckboxStyles at the end of refreshDashboardTable? No, refreshDashboardTable is an async function. It's better to add the sync inside refreshDashboardTable after `oldTbody.innerHTML = newTbody.innerHTML;`.

const htmlReplaceSearch = `if (newTbody && oldTbody) oldTbody.innerHTML = newTbody.innerHTML;`;
const htmlReplaceReplace = `if (newTbody && oldTbody) oldTbody.innerHTML = newTbody.innerHTML;
      if (typeof syncCheckboxStyles === 'function') syncCheckboxStyles();`;
content = content.replace(htmlReplaceSearch, htmlReplaceReplace);

fs.writeFileSync(ejsPath, content);
console.log("Patched successfully!");
