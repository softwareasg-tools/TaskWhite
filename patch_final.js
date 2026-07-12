const fs = require('fs');

// 1. Fix Layout Modal Autofocus to respect data-autofocus or fallback to first input
const layoutFile = 'views/layout.ejs';
let layout = fs.readFileSync(layoutFile, 'utf8');
layout = layout.replace(
  /\/\/ Focus the first input field, select, or textarea\s*const firstInput = modal\.querySelector\('input:not\(\[type="hidden"\]\), select, textarea'\);\s*if \(firstInput\) \{\s*firstInput\.focus\(\);\s*\} else \{/,
  `// Focus based on data-autofocus attribute, then fallback to first input, then fallback to primary btn
          const explicitFocus = modal.querySelector('[data-autofocus="true"]');
          const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
          if (explicitFocus) {
             explicitFocus.focus();
          } else if (firstInput) {
            firstInput.focus();
          } else {`
);
fs.writeFileSync(layoutFile, layout, 'utf8');

// 2. Add data-autofocus to the status dropdown in the edit modal
const dbFile = 'views/pages/dashboard.ejs';
let db = fs.readFileSync(dbFile, 'utf8');
db = db.replace(
  /<select id="edit_status_input" class="form-select" required>/,
  `<select id="edit_status_input" class="form-select" required data-autofocus="true">`
);

// Remove the prepend logic for completed tasks in triggerCompleteEffects
db = db.replace(
  /if \(t\.row\.parentNode\) \{\s*tbody\.prepend\(t\.row\);\s*t\.row\.style\.opacity = '1';\s*t\.row\.style\.transform = 'scale\(1\)';\s*t\.row\.style\.backgroundColor = 'rgba\(135, 206, 235, 0\.2\)';\s*\}/s,
  `if (t.row.parentNode) {
                 t.row.style.opacity = '1';
                 t.row.style.transform = 'scale(1)';
                 t.row.style.backgroundColor = 'rgba(135, 206, 235, 0.2)';
              }`
);

fs.writeFileSync(dbFile, db, 'utf8');

console.log('Patches applied successfully.');
