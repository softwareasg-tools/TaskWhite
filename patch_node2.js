const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

// 1. Add class to clone
const cloneSearch = `clone.classList.remove('task-complete-anim');`;
const cloneReplace = `clone.classList.remove('task-complete-anim');
            clone.classList.add('task-linger-blue-anim');`;
content = content.replace(cloneSearch, cloneReplace);

// 2. Focus on edit_status_input when modal opens
const focusSearch = `editTaskModalObj.show();`;
const focusReplace = `editTaskModalObj.show();
      setTimeout(() => {
        const statusInput = document.getElementById('edit_status_input');
        if (statusInput) statusInput.focus();
      }, 200);`;
content = content.replace(focusSearch, focusReplace);

// 3. Remove duplicate Ctrl+Enter
const ctrlEnterSearch = `    document.addEventListener('keydown', function(e) {
      // Ignore shortcuts if the user is typing in an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur(); // Escape removes focus from inputs
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          const modal = e.target.closest('.modal');
          if (modal) {
            const form = modal.querySelector('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              const submitBtn = form.querySelector('button[type="submit"]');
              if (submitBtn) submitBtn.click();
            }
          }
        }
        return;
      }`;
const ctrlEnterReplace = `    document.addEventListener('keydown', function(e) {
      // Ignore shortcuts if the user is typing in an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur(); // Escape removes focus from inputs
        }
        return;
      }`;
if (content.includes(ctrlEnterSearch)) {
  content = content.replace(ctrlEnterSearch, ctrlEnterReplace);
} else {
  // Let's try without return; just in case it doesn't match perfectly
  console.log("Warning: First ctrlEnterSearch didn't match perfectly, using regex");
  content = content.replace(/if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === 'Enter'\) \{[\s\S]*?submitBtn\.click\(\);\s*\}\s*\}\s*\}/, "");
}

fs.writeFileSync(ejsPath, content);
console.log("Patches applied successfully!");
