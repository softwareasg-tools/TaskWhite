import re

with open('E:/Antigravity/TaskWhite/new_js.txt', 'r', encoding='utf-8') as f:
    new_js = f.read()

with open('E:/Antigravity/TaskWhite/views/pages/dashboard.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace triggerCompleteEffects and quickMarkComplete
content = re.sub(r'  function triggerCompleteEffects.*?  function updateShortcutFooterState', new_js + '\n  function updateShortcutFooterState', content, flags=re.DOTALL)

# Replace 'M' shortcut block
m_shortcut_old = '''      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const cb = focusedRow.querySelector('.row-checkbox');
        if (cb) quickMarkComplete(cb.value);
        return;'''

m_shortcut_new = '''      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const selectedCheckboxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
        if (selectedCheckboxes.length > 0) {
          const taskIds = selectedCheckboxes.map(cb => cb.value);
          quickMarkComplete(taskIds);
        } else {
          const cb = focusedRow.querySelector('.row-checkbox');
          if (cb) quickMarkComplete([cb.value]);
        }
        return;'''

content = content.replace(m_shortcut_old, m_shortcut_new)

with open('E:/Antigravity/TaskWhite/views/pages/dashboard.ejs', 'w', encoding='utf-8') as f:
    f.write(content)
