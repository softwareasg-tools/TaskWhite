const fs = require('fs');

// Fix dashboard.ejs: kbd and 'v' shortcut
let dash = fs.readFileSync('views/pages/dashboard.ejs', 'utf8');
dash = dash.replace(/<kbd class="bg-surface text-dark border"/g, '<kbd class="bg-surface border"');
dash = dash.replace(/<kbd class="bg-surface text-dark border border-danger"/g, '<kbd class="bg-surface border border-danger"');
// Fix 'v' shortcut
const vShortcutOld = `    } else if (e.key === 'v') {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.search);
      const currentView = urlParams.get('task_view') || 'list';
      if (currentView === 'list') {
        const calBtn = document.querySelector('.btnCalendarView');
        if(calBtn) calBtn.click();
      } else {
        const listBtn = document.querySelector('.btnListView');
        if(listBtn) listBtn.click();
      }`;
const vShortcutNew = `    } else if (e.key.toLowerCase() === 'v') {
      e.preventDefault();
      const listView = document.getElementById('listView');
      if (listView && !listView.classList.contains('d-none')) {
        const calBtn = document.querySelector('.btnCalendarView');
        if(calBtn) calBtn.click();
      } else {
        const listBtn = document.querySelector('.btnListView');
        if(listBtn) listBtn.click();
      }`;
dash = dash.replace(vShortcutOld, vShortcutNew);
fs.writeFileSync('views/pages/dashboard.ejs', dash);
console.log('Fixed dashboard.ejs');

// Fix templates.ejs: use custom dropdown for Task Types
let templates = fs.readFileSync('views/pages/templates.ejs', 'utf8');

const oldSelect = `<select id="templateTaskType" class="form-select" required onchange="handleTaskTypeChange(this)">
            <option value="">Select Task...</option>
            <option value="ADD_NEW" class="fw-bold text-primary" style="color: var(--primary); font-weight: bold;">+ Add New Task</option>
            <option disabled>──────────</option>
            <% taskTypes.forEach(type => { %>
              <option value="<%= type.id %>"><%= type.name %></option>
            <% }) %>
          </select>`;

const newDropdown = `<div class="dropdown">
            <button class="form-select text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" aria-expanded="false" id="templateTaskTypeBtn">
              <span class="text-muted">Select Task...</span>
            </button>
            <ul class="dropdown-menu w-100 shadow-sm border-0 py-2" style="max-height: 300px; overflow-y: auto;">
              <li>
                <a class="dropdown-item fw-bold text-primary py-2 d-flex align-items-center gap-2" style="background-color: var(--bg-subtle);" href="#" onclick="handleInlineCreateCustom('task_type', event)">
                  <i class="bi bi-plus-circle-fill"></i> Add New Task
                </a>
              </li>
              <li><hr class="dropdown-divider"></li>
              <% taskTypes.forEach(type => { %>
                <li><a class="dropdown-item py-2" href="#" onclick="selectDropdownOption('task_type', '<%= type.id %>', '<%= type.name.replace(/\\x27/g, '\\\\\\'') %>', event)"><%= type.name %></a></li>
              <% }) %>
            </ul>
            <input type="hidden" id="templateTaskType" required>
          </div>`;

templates = templates.replace(oldSelect, newDropdown);

// Add missing selectDropdownOption function and adjust handleInlineCreateCustom
const extraScripts = `
  function selectDropdownOption(type, id, name, e) {
    if(e) e.preventDefault();
    if(type === 'task_type') {
      const btn = document.getElementById('templateTaskTypeBtn');
      if (btn) btn.innerHTML = '<span>' + name + '</span>';
      const hidden = document.getElementById('templateTaskType');
      if (hidden) hidden.value = id;
    }
  }

  async function handleInlineCreateCustom(type, event) {
    if (event) event.preventDefault();
    let name = prompt('Enter new Task name:');
    if (!name || name.trim() === '') return;
    try {
      const res = await fetch('/api/task-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        selectDropdownOption('task_type', data.taskType.id, data.taskType.name);
        showToast('Task added successfully', 'success');
        setTimeout(() => location.reload(), 1000); // Reload to show in list
      } else {
        showToast(data.error || 'Failed to create task', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error', 'danger');
    }
  }
</script>`;

// Replace old handleTaskTypeChange block
const oldJS = `  async function handleTaskTypeChange(selectElem) {
    if (selectElem.value === 'ADD_NEW') {
      let name = prompt('Enter new Task name:');
      if (!name || name.trim() === '') {
        selectElem.value = '';
        return;
      }
      try {
        const res = await fetch('/api/task-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() })
        });
        const data = await res.json();
        if (res.ok) {
          const newOption = new Option(data.taskType.name, data.taskType.id, true, true);
          selectElem.add(newOption);
          showToast('Task added successfully', 'success');
        } else {
          showToast(data.error || 'Failed to create task', 'danger');
          selectElem.value = '';
        }
      } catch (err) {
        console.error(err);
        showToast('Server error', 'danger');
        selectElem.value = '';
      }
    }
  }
</script>`;

templates = templates.replace(oldJS, extraScripts);

fs.writeFileSync('views/pages/templates.ejs', templates);
console.log('Fixed templates.ejs');
