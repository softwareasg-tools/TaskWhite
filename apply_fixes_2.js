const fs = require('fs');
const file = 'views/pages/dashboard.ejs';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /document\.addEventListener\('keydown', function\(e\) \{[\s\S]*?if \(\['INPUT', 'TEXTAREA', 'SELECT'\]\.includes\(e\.target\.tagName\) \|\| e\.target\.isContentEditable\) \{/,
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
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fix applied.');
