const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

// 1. CSS
const cssSearch = `  .task-highlight-anim th {
    background-color: transparent !important;
    --bs-table-bg: transparent;
    --bs-table-accent-bg: transparent;
    --bs-table-striped-bg: transparent;
  }`;
const cssReplace = cssSearch + `
  .task-linger-blue-anim {
    background-color: rgba(135, 206, 235, 0.4) !important;
    transition: background-color 3s ease-out;
  }
  .task-linger-blue-anim td,
  .task-linger-blue-anim th {
    background-color: transparent !important;
    --bs-table-bg: transparent;
    --bs-table-accent-bg: transparent;
    --bs-table-striped-bg: transparent;
  }`;
content = content.replace(cssSearch, cssReplace);

// 2. refreshDashboardTable
const refreshSearch = `      if (taskIdToHighlight) {
        const checkbox = document.querySelector(\`.row-checkbox[value="\${taskIdToHighlight}"]\`);
        if (checkbox) {
          const tr = checkbox.closest('tr');
          if (tr) {
            tr.classList.add('task-highlight-anim');
            setTimeout(() => {
              tr.classList.remove('task-highlight-anim');
            }, 10000);
          }
        }
      }
    } catch(e) {`;
const refreshReplace = `      if (taskIdToHighlight) {
        const checkbox = document.querySelector(\`.row-checkbox[value="\${taskIdToHighlight}"]\`);
        if (checkbox) {
          const tr = checkbox.closest('tr');
          if (tr) {
            tr.classList.add('task-highlight-anim');
            setTimeout(() => {
              tr.classList.remove('task-highlight-anim');
            }, 10000);
          }
        }
      }

      const completedTasksHighlight = JSON.parse(sessionStorage.getItem('completedTasksHighlight') || '[]');
      if (completedTasksHighlight.length > 0) {
        sessionStorage.removeItem('completedTasksHighlight');
        completedTasksHighlight.forEach(taskId => {
          const checkbox = document.querySelector(\`.row-checkbox[value="\${taskId}"]\`);
          if (checkbox) {
            const tr = checkbox.closest('tr');
            if (tr) {
              tr.classList.add('task-linger-blue-anim');
              setTimeout(() => {
                tr.classList.remove('task-linger-blue-anim');
              }, 3000);
            }
          }
        });
      }
    } catch(e) {`;
content = content.replace(refreshSearch, refreshReplace);

// 3. triggerCompleteEffects
const newJs = fs.readFileSync('E:/Antigravity/TaskWhite/new_js_safe.txt', 'utf8');
const startIdx = content.indexOf('  function triggerCompleteEffects(taskIds) {');
const endIdx = content.indexOf('  async function quickMarkComplete(taskIds) {');

if (startIdx > -1 && endIdx > -1) {
  content = content.substring(0, startIdx) + newJs + '\n\n' + content.substring(endIdx);
  fs.writeFileSync(ejsPath, content);
  console.log('Successfully patched everything!');
} else {
  console.log('Indices not found!', startIdx, endIdx);
}
