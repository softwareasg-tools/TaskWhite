const fs = require('fs');
const ejsPath = 'E:/Antigravity/TaskWhite/views/pages/dashboard.ejs';
let content = fs.readFileSync(ejsPath, 'utf8');

const regex = /const isAnyModalOpen = document\.querySelector\('\.modal\.show'\) !== null;\s+if \(isAnyModalOpen\) \{\s+if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === 'Enter'\) \{\s+const activeModal = document\.querySelector\('\.modal\.show'\);/;

const replace = `    const isAnyModalOpen = document.querySelector('.modal.show') !== null;
    if (isAnyModalOpen) {
      if (e.key === 'Enter') {
        // Do not intercept Enter for SELECT elements so they can open dropdowns natively
        if (e.target.tagName === 'SELECT' || e.target.id === 'tagInputField') {
          // just let it fall through
        } else {
          const activeModal = document.querySelector('.modal.show');
          if (activeModal) {
            e.preventDefault();
            const form = activeModal.querySelector('form');
            if (form) {
              const submitBtn = form.querySelector('button[type="submit"]');
              if (submitBtn) submitBtn.click();
            }
          }
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeModal = document.querySelector('.modal.show');`;

if (regex.test(content)) {
  content = content.replace(regex, replace);
  fs.writeFileSync(ejsPath, content);
  console.log("Patched Enter logic correctly!");
} else {
  console.log("Could not find search string via regex.");
}
