import re

with open('E:/Antigravity/TaskWhite/views/pages/dashboard.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
css_old = '''  .task-highlight-anim td,
  .task-highlight-anim th {
    background-color: transparent !important;
    --bs-table-bg: transparent;
    --bs-table-accent-bg: transparent;
    --bs-table-striped-bg: transparent;
  }'''

css_new = css_old + '''
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
  }'''
content = content.replace(css_old, css_new)

# 2. Update triggerCompleteEffects timing
trigger_old = '''          if (globalArchiveRule === '0') {
            setTimeout(() => {
              r.classList.remove('task-complete-anim');
              r.classList.add('task-complete-anim-fadeout');
              setTimeout(() => {
                r.style.display = 'none'; // hide it
                fetch(/tasks//archive-immediate, { method: 'POST' });
              }, 500);
            }, 5000);
          } else {
            // Keep blue for 5 seconds
            setTimeout(() => {
              r.classList.remove('task-complete-anim');
              r.classList.add('task-complete-anim-fadeout');
              setTimeout(() => {
                r.classList.remove('task-complete-anim-fadeout');
              }, 2000);
            }, 5000);
          }
        }
      });
    });

    // Refresh table after 5 seconds so they stay blue for exactly 5s before jumping to the top!
    setTimeout(() => {
      if (globalArchiveRule === '0') showToast(taskIds.length > 1 ? ${taskIds.length} tasks moved to archives : 'Task moved to archives', 'success');
      else showToast(taskIds.length > 1 ? ${taskIds.length} tasks marked completed! : 'Task status updated!', 'success');
      refreshDashboardTable();
    }, 5500);'''

trigger_new = '''          if (globalArchiveRule === '0') {
            setTimeout(() => {
              r.classList.remove('task-complete-anim');
              r.classList.add('task-complete-anim-fadeout');
              setTimeout(() => {
                r.style.display = 'none'; // hide it
                fetch(/tasks//archive-immediate, { method: 'POST' });
              }, 500);
            }, 3000);
          }
        }
      });
    });

    // Refresh table after 3 seconds
    setTimeout(() => {
      if (globalArchiveRule === '0') {
        showToast(taskIds.length > 1 ? ${taskIds.length} tasks moved to archives : 'Task moved to archives', 'success');
      } else {
        showToast(taskIds.length > 1 ? ${taskIds.length} tasks marked completed! : 'Task status updated!', 'success');
        sessionStorage.setItem('completedTasksHighlight', JSON.stringify(taskIds));
      }
      refreshDashboardTable();
    }, 3000);'''
content = content.replace(trigger_old, trigger_new)

# 3. Update refreshDashboardTable logic
refresh_old = '''      if (taskIdToHighlight) {
        const checkbox = document.querySelector(.row-checkbox[value=""]);
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
    } catch(e) {'''

refresh_new = '''      if (taskIdToHighlight) {
        const checkbox = document.querySelector(.row-checkbox[value=""]);
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
          const checkbox = document.querySelector(.row-checkbox[value=""]);
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
    } catch(e) {'''
content = content.replace(refresh_old, refresh_new)

with open('E:/Antigravity/TaskWhite/views/pages/dashboard.ejs', 'w', encoding='utf-8') as f:
    f.write(content)
