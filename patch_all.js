const fs = require('fs');

// 1. Patch dashboardController.js (Sorting logic)
const ctrlFile = 'controllers/dashboardController.js';
let ctrl = fs.readFileSync(ctrlFile, 'utf8');
ctrl = ctrl.replace(
  /\/\/ Sort tasks: Completed first.*?\}\);/s,
  `// Sort tasks: purely by due_date ascending, then by updated_at descending
    mappedTasks.sort((a, b) => {
      if (!a.due_date && !b.due_date) {
         const aTime = a.updated_at?._seconds || a.created_at?._seconds || 0;
         const bTime = b.updated_at?._seconds || b.created_at?._seconds || 0;
         return bTime - aTime;
      }
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });`
);
fs.writeFileSync(ctrlFile, ctrl, 'utf8');

// 2. Patch layout.ejs (Toast timing and modal autofocus)
const layoutFile = 'views/layout.ejs';
let layout = fs.readFileSync(layoutFile, 'utf8');
layout = layout.replace(
  /const primaryBtn = modal\.querySelector\('\.modal-footer \.btn-primary, \.modal-footer \.btn-danger, \.modal-footer \.btn-dark, \.modal-footer button\[type="submit"\]'\);\s*if \(primaryBtn\) \{\s*primaryBtn\.focus\(\);\s*\} else \{\s*\/\/ Fallback to the first focusable element\s*const focusable = modal\.querySelector\('button, \[href\], input, select, textarea, \[tabindex\]:not\(\[tabindex="-1"\]\)'\);\s*if \(focusable\) focusable\.focus\(\);\s*\}/s,
  `// Focus the first input field, select, or textarea
          const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
          if (firstInput) {
            firstInput.focus();
          } else {
            const primaryBtn = modal.querySelector('.modal-footer .btn-primary, .modal-footer .btn-danger, .modal-footer .btn-dark, .modal-footer button[type="submit"]');
            if (primaryBtn) primaryBtn.focus();
          }`
);
layout = layout.replace(/setTimeout\(\(\) => \{\s*toastEl\.style\.opacity = '0';\s*setTimeout\(\(\) => toastEl\.remove\(\), 300\);\s*\}, 5000\);/s, 
  `setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => toastEl.remove(), 300);
      }, 10000);`
);
fs.writeFileSync(layoutFile, layout, 'utf8');

// 3. Patch dashboard.ejs (Table Header and Keydown Logic)
const dbFile = 'views/pages/dashboard.ejs';
let db = fs.readFileSync(dbFile, 'utf8');
db = db.replace(
  /<th class="text-uppercase text-secondary fw-semibold" style="letter-spacing: 0.5px;">DUE DATE <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0.8em;"><\/i><\/th>/s,
  `<th class="text-uppercase text-secondary fw-semibold" style="letter-spacing: 0.5px; color: #0d6efd !important;">DUE DATE <i class="bi bi-arrow-down ms-1" style="font-size: 0.9em; font-weight:bold;"></i></th>`
);

db = db.replace(
  /if \(e\.key === 'Enter'\) \{\s*if \(e\.target\.closest\('select'\)\) \{\s*return; \/\/ Let browser natively handle Enter on select dropdowns \(open\/close\/select\)\s*\}\s*if \(e\.target\.tagName === 'TEXTAREA' && !e\.ctrlKey && !e\.metaKey\) \{\s*return; \/\/ Let user type newlines in textareas unless Ctrl\+Enter\s*\}/s,
  `if (e.key === 'Enter') {
        if (e.ctrlKey || e.metaKey) {
           e.preventDefault();
           const form = activeModal.querySelector('form');
           if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
           return;
        }
        if (e.target.closest('select')) {
           return; // Let browser natively handle Enter on select dropdowns (open/close/select)
        }
        if (e.target.tagName === 'TEXTAREA') {
           return; // Let user type newlines in textareas
        }`
);
fs.writeFileSync(dbFile, db, 'utf8');

console.log('All patches applied successfully.');
