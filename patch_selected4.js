const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

// 1. Remove archive logic from triggerCompleteEffects
const archiveSearch = `    if (globalArchiveRule === '0') {
      setTimeout(() => {
        tasksToAnimate.forEach(t => {
          t.row.classList.remove('task-complete-anim');
          t.row.classList.add('task-complete-anim-fadeout');
          setTimeout(() => {
            t.row.style.display = 'none';
            fetch(\`/tasks/\${t.taskId}/archive-immediate\`, { method: 'POST' });
          }, 500);
        });
        
        setTimeout(() => {
          showToast(taskIds.length > 1 ? \`\${taskIds.length} tasks moved to archives\` : 'Task moved to archives', 'success');
          refreshDashboardTable();
        }, 500);
      }, 3000);
    } else {`;
const archiveReplace = `    if (false) {`;
content = content.replace(archiveSearch, archiveReplace);

// 2. Add search filter re-apply logic to refreshDashboardTable
const htmlSearch = `if (newTbody && oldTbody) oldTbody.innerHTML = newTbody.innerHTML;
      if (typeof syncCheckboxStyles === 'function') syncCheckboxStyles();`;
const htmlReplace = `if (newTbody && oldTbody) oldTbody.innerHTML = newTbody.innerHTML;
      if (typeof syncCheckboxStyles === 'function') syncCheckboxStyles();
      
      const searchInput = document.getElementById('dashboardSearch');
      if (searchInput && searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }`;
content = content.replace(htmlSearch, htmlReplace);

// 3. Add Enter to save for inputs inside modal (except tagInputField)
const enterSearch = `    document.addEventListener('keydown', function(e) {
      // Ignore shortcuts if the user is typing in an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur(); // Escape removes focus from inputs
        }
        
        return;
      }`;
const enterReplace = `    document.addEventListener('keydown', function(e) {
      // Ignore shortcuts if the user is typing in an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur(); // Escape removes focus from inputs
        }
        
        if (e.key === 'Enter' && e.target.id !== 'tagInputField') {
          const activeModal = e.target.closest('.modal.show');
          if (activeModal) {
            e.preventDefault();
            const form = activeModal.querySelector('form');
            if (form) {
              const submitBtn = form.querySelector('button[type="submit"]');
              if (submitBtn) submitBtn.click();
            }
          }
        }
        
        return;
      }`;
content = content.replace(enterSearch, enterReplace);

fs.writeFileSync(ejsPath, content);
console.log("Patched correctly!");
