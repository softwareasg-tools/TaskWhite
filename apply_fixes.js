const fs = require('fs');
const file = 'views/pages/dashboard.ejs';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix Modal Keydown Logic (Focus Stealing and Enter functionality)
code = code.replace(
  /document\.addEventListener\('keydown', function\(e\) \{[\s\S]*?if \(\['INPUT', 'TEXTAREA', 'SELECT'\]\.includes\(e\.target\.tagName\)\) \{/,
  `document.addEventListener('keydown', function(e) {
    // Handle Enter and Ctrl+Enter inside active modal inputs/selects BEFORE ignoring generic shortcuts
    const activeModal = document.querySelector('.modal.show');
    if (activeModal && e.target.closest('.modal.show')) {
      if (e.key === 'Enter') {
        if (e.target.closest('select')) {
           return; // Let browser natively handle Enter on select dropdowns (open/close/select)
        }
        if (e.target.tagName === 'TEXTAREA' && !e.ctrlKey && !e.metaKey) {
           return; // Let user type newlines in textareas unless Ctrl+Enter
        }
        if (e.target.id === 'tagInputField') {
           return; // Let the tag input process the tag on Enter
        }
        if (e.target.tagName === 'BUTTON') {
           return; // Let standard button behavior occur
        }
        
        e.preventDefault();
        const form = activeModal.querySelector('form');
        if (form) {
           form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
        return;
      }
    }

    // Ignore shortcuts if the user is typing in an input, textarea, or select
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {`
);

// 2. Fix refreshDashboardTable to only replace specific row if not completed (Preserve Filter and Order)
code = code.replace(
  /const newTbody = doc\.querySelector\('\.table tbody'\);\s*const oldTbody = document\.querySelector\('\.table tbody'\);\s*if \(newTbody && oldTbody\) oldTbody\.innerHTML = newTbody\.innerHTML;/,
  `const newTbody = doc.querySelector('.table tbody');
      const oldTbody = document.querySelector('.table tbody');
      
      if (taskIdToHighlight && (!completedTaskIds || completedTaskIds.length === 0)) {
        // ONLY replace the edited row to prevent the entire table from re-sorting or breaking filter views!
        const newRowCheckbox = newTbody.querySelector(\`.row-checkbox[value="\${taskIdToHighlight}"]\`);
        const oldRowCheckbox = oldTbody.querySelector(\`.row-checkbox[value="\${taskIdToHighlight}"]\`);
        if (newRowCheckbox && oldRowCheckbox) {
          const newRow = newRowCheckbox.closest('tr');
          const oldRow = oldRowCheckbox.closest('tr');
          if (newRow && oldRow) {
            oldRow.outerHTML = newRow.outerHTML;
          }
        }
      } else {
        if (newTbody && oldTbody) oldTbody.innerHTML = newTbody.innerHTML;
      }`
);

// 3. Fix triggerCompleteEffects Animation (Simpler, won't stop midway, moves to top)
code = code.replace(
  /\/\/ Start climbing animation after 3 seconds[\s\S]*?refreshDashboardTable\(null, taskIds\);\s*\}, 3000\);/m,
  `// Start completed row movement
      setTimeout(() => {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) {
          refreshDashboardTable(null, taskIds);
          return;
        }
        
        tasksToAnimate.forEach(t => {
           t.row.classList.remove('task-complete-anim');
           t.row.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
           t.row.style.opacity = '0';
           t.row.style.transform = 'scale(0.95)';
           
           setTimeout(() => {
              if (t.row.parentNode) {
                 tbody.prepend(t.row);
                 t.row.style.opacity = '1';
                 t.row.style.transform = 'scale(1)';
                 t.row.style.backgroundColor = 'rgba(135, 206, 235, 0.2)';
              }
           }, 500);
        });

        // Refresh table fully after animation completes
        setTimeout(() => {
          showToast(taskIds.length > 1 ? \`\${taskIds.length} tasks marked completed!\` : 'Task status updated!', 'success');
          refreshDashboardTable(null, taskIds);
        }, 1500);`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixes applied.');
