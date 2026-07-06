import re

with open('E:/Antigravity/TaskWhite/new_js_safe.txt', 'r', encoding='utf-8') as f:
    new_js = f.read()

with open('E:/Antigravity/TaskWhite/views/pages/dashboard.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace triggerCompleteEffects
content = re.sub(r'  function triggerCompleteEffects.*?  async function quickMarkComplete', new_js + '\n  async function quickMarkComplete', content, flags=re.DOTALL)

with open('E:/Antigravity/TaskWhite/views/pages/dashboard.ejs', 'w', encoding='utf-8') as f:
    f.write(content)
