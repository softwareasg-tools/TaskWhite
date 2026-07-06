
  let activeDeleteTaskId = null;
  let moveModal = null;
  let confirmModal = null;

  function deleteTask(event, taskId, taskTypeName, clientName, isAssigned, status) {
    event.stopPropagation();
    
    if (isAssigned && status !== 'Completed') {
      showToast('This task is actively assigned. Please mark it as Completed or modify it instead of deleting.', 'danger');
      return;
    }
    
    activeDeleteTaskId = taskId;
    
    // Populate details in the modals
    const displayText = `${taskTypeName} — ${clientName}`;
    document.getElementById('moveTaskDetails').innerText = displayText;
    document.getElementById('confirmTaskDetails').innerText = displayText;
    
    if (!moveModal) {
      moveModal = new bootstrap.Modal(document.getElementById('moveRecycleModal'));
    }
    moveModal.show();
  }

  function proceedToConfirm() {
    if (moveModal) {
      moveModal.hide();
    }
    if (!confirmModal) {
      confirmModal = new bootstrap.Modal(document.getElementById('confirmRecycleModal'));
    }
    confirmModal.show();
  }

  async function executeSoftDelete() {
    if (!activeDeleteTaskId) return;
    try {
      const response = await fetch(`/tasks/${activeDeleteTaskId}`, { method: 'DELETE' });
      if (response.ok) {
        reloadWithSuccess('Action completed successfully!');
      } else {
        showToast('Failed to delete task.', 'danger');
      }
    } catch (err) {
      showToast('Error deleting task.', 'danger');
    }
  }

  function confirmBulkDeleteDashboardTasks() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return;
    
    const idsToTrash = [];
    let assignedCount = 0;
    
    checked.forEach(cb => {
      const isAssigned = cb.getAttribute('data-assigned') === 'true';
      const status = cb.getAttribute('data-status');
      
      if (isAssigned && status !== 'Completed') {
        assignedCount++;
      } else {
        idsToTrash.push(cb.value);
      }
    });
    
    if (assignedCount > 0 && idsToTrash.length === 0) {
      showToast(`Cannot delete ${assignedCount} assigned task(s). Please mark them as completed or modify them instead.`, 'danger');
      return;
    }
    
    if (assignedCount > 0) {
      showToast(`${assignedCount} task(s) are assigned and will be skipped.`, 'danger');
    }

    if (idsToTrash.length > 0) {
      if (confirm(`Move ${idsToTrash.length} task(s) to recycle bin?`)) {
        executeBulkDashboardTrash(idsToTrash);
      }
    }
  }

  async function executeBulkDashboardTrash(ids) {
    try {
      for (const id of ids) {
        await fetch(`/tasks/${id}`, { method: 'DELETE' });
      }
      reloadWithSuccess('Action completed successfully!');
    } catch(err) {
      console.error(err);
      showToast('Error moving tasks to trash.', 'danger');
    }
  }

  function toggleCustomDateFields() {
    const timeSelect = document.getElementById('timeFilterSelect');
    const customFields = document.getElementById('customDateFields');
    if (timeSelect.value === 'custom') {
      customFields.style.display = 'block';
    } else {
      customFields.style.display = 'none';
      // clear the inputs when hidden
      document.querySelector('input[name="start_date"]').value = '';
      document.querySelector('input[name="end_date"]').value = '';
    }
  }

  function selectDropdownOption(type, id, name, event) {
    if (event) event.preventDefault();
    if (type === 'client') {
      document.getElementById('client_id_input').value = id;
      document.querySelector('#clientSelectBtn span').innerText = name;
      document.querySelector('#clientSelectBtn span').classList.remove('text-muted');
    } else if (type === 'task_type') {
      document.getElementById('task_type_id_input').value = id;
      document.querySelector('#taskTypeSelectBtn span').innerText = name;
      document.querySelector('#taskTypeSelectBtn span').classList.remove('text-muted');
    }
  }

  async function handleInlineCreateCustom(type, event) {
    if (event) event.preventDefault();
    let promptText = type === 'client' ? 'Enter new Client name:' : 'Enter new Task name:';
    let url = type === 'client' ? '/api/clients' : '/api/task-types';
    
    let name = prompt(promptText);
    if (!name || name.trim() === '') {
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const data = await response.json();
      
      // Auto-select the newly created item
      selectDropdownOption(type, data.id, data.name, null);

      // Dynamically add it to the dropdown list
      const ul = type === 'client' 
        ? document.querySelector('#clientSelectBtn').nextElementSibling 
        : document.querySelector('#taskTypeSelectBtn').nextElementSibling;
      
      const li = document.createElement('li');
      li.innerHTML = `<a class="dropdown-item py-2" href="#" onclick="selectDropdownOption('${type}', '${data.id}', '${data.name.replace(/\x27/g, '\\\'')}', event)">${data.name}</a>`;
      ul.appendChild(li);

    } catch (error) {
      showToast('Error creating item. Please try again.', 'danger');
    }
  }

  function exportExcel() {
    const query = window.location.search;
    window.location.href = '/tasks/export' + query;
  }

  let editTaskModalObj = null;

  function openTaskModal(taskId) {
    if (!editTaskModalObj) {
      editTaskModalObj = new bootstrap.Modal(document.getElementById('editTaskModal'));
    }
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('edit_task_id').value = task.id;
    document.getElementById('edit_status_input').value = task.status;
    document.getElementById('edit_client_id_input').value = task.client_id || '';
    document.getElementById('edit_task_type_id_input').value = task.task_type_id || '';
    document.getElementById('edit_assigned_user_id_input').value = task.assigned_user_id || '';
    document.getElementById('edit_due_date_input').value = task.due_date || '';
    document.getElementById('edit_tags_input').value = (task.tags || []).join(', ');

    editTaskModalObj.show();
  }

  async function submitEditTask(e) {
    e.preventDefault();
    const taskId = document.getElementById('edit_task_id').value;
    const errorDiv = document.getElementById('editTaskError');
    errorDiv.style.display = 'none';

    const payload = {
      status: document.getElementById('edit_status_input').value,
      client_id: document.getElementById('edit_client_id_input').value,
      task_type_id: document.getElementById('edit_task_type_id_input').value,
      assigned_user_id: document.getElementById('edit_assigned_user_id_input').value,
      due_date: document.getElementById('edit_due_date_input').value,
      tags: document.getElementById('edit_tags_input').value
    };

    try {
      const response = await fetch('/tasks/' + taskId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        if (payload.status === 'Completed') {
          bootstrap.Modal.getInstance(document.getElementById('editTaskModal'))?.hide();
          triggerCompleteEffects(taskId);
        } else {
          bootstrap.Modal.getInstance(document.getElementById('editTaskModal'))?.hide();
          showToast('Action completed successfully!', 'success');
          refreshDashboardTable(taskId);
        }
      } else {
        errorDiv.innerText = data.error || 'Failed to update task.';
        errorDiv.style.display = 'block';
      }
    } catch(err) {
      console.error(err);
      errorDiv.innerText = 'Server error. Please try again.';
      errorDiv.style.display = 'block';
    }
  }

  let currentSortCol = -1;
  let currentSortDir = 'asc';

  function sortByActionDate() {
    const table = document.querySelector(".table");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr.dashboard-task-row"));
    
    if (rows.length === 0) return;

    if (currentSortCol === 'actions') {
      currentSortDir = currentSortDir === 'desc' ? 'asc' : 'desc'; // Default to descending first when clicking? We'll just toggle.
    } else {
      currentSortCol = 'actions';
      currentSortDir = 'desc'; // Most recent first is usually best for action dates
    }

    rows.sort((a, b) => {
      const aVal = parseInt(a.getAttribute('data-timestamp') || '0', 10);
      const bVal = parseInt(b.getAttribute('data-timestamp') || '0', 10);
      
      if (aVal < bVal) return currentSortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return currentSortDir === 'asc' ? 1 : -1;
      return 0;
    });

    rows.forEach(r => tbody.appendChild(r));
  }

  function sortTable(n) {
    const table = document.querySelector(".table");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr.dashboard-task-row"));
    
    if (rows.length === 0) return;

    if (currentSortCol === n) {
      currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortCol = n;
      currentSortDir = 'asc';
    }

    rows.sort((a, b) => {
      const aText = a.cells[n].innerText.toLowerCase();
      const bText = b.cells[n].innerText.toLowerCase();
      
      if (aText < bText) return currentSortDir === 'asc' ? -1 : 1;
      if (aText > bText) return currentSortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.append(...rows);
  }

  // Reactive Search
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize Flatpickr
    if (typeof flatpickr !== 'undefined') {
      flatpickr("#due_date_input", { dateFormat: "Y-m-d", allowInput: false });
      flatpickr("#repeat_end_date", { dateFormat: "Y-m-d", allowInput: false });
      flatpickr("#filter_start_date", { dateFormat: "Y-m-d", allowInput: false });
      flatpickr("#filter_end_date", { dateFormat: "Y-m-d", allowInput: false });
      flatpickr("#edit_due_date_input", { dateFormat: "Y-m-d", allowInput: false });
    }

    const searchInput = document.getElementById('dashboardSearch');
    const rows = document.querySelectorAll('.dashboard-task-row');
    
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        const currentRows = document.querySelectorAll('.dashboard-task-row');
        currentRows.forEach(row => {
          const text = row.innerText.toLowerCase();
          if (text.includes(term)) {
            row.classList.remove('d-none');
            row.style.display = '';
          } else {
            row.classList.add('d-none');
            row.style.display = 'none';
          }
        });
      });
    }
    
    // Auto-open New Task Modal if ?action=new
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      const newTaskModal = new bootstrap.Modal(document.getElementById('newTaskModal'));
      newTaskModal.show();
      // Remove param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Tag Input Logic
    const tagInputField = document.getElementById('tagInputField');
    const tagInputContainer = document.getElementById('tagInputContainer');
    const hiddenTagsInput = document.getElementById('hiddenTagsInput');
    let currentTags = [];
    window.toggleRepeatOptions = function() {
      const isRepeat = document.getElementById('repeatTaskToggle').checked;
      document.getElementById('repeatTaskOptions').style.display = isRepeat ? 'block' : 'none';
    };

    window.adjustRepeatDetailFields = function() {
      const freq = document.getElementById('repeat_frequency').value;
      document.getElementById('weeklyOptions').style.display = freq === 'weekly' ? 'block' : 'none';
      document.getElementById('monthlyOptions').style.display = freq === 'monthly' ? 'block' : 'none';
    };

    window.adjustMonthlyFields = function() {
      const type = document.getElementById('repeat_monthly_type').value;
      document.getElementById('monthlyDayField').style.display = type === 'dayOfMonth' ? 'block' : 'none';
      document.getElementById('monthlyWeekField').style.display = type === 'dayOfWeek' ? 'block' : 'none';
    };

    window.adjustEndFields = function() {
      const type = document.getElementById('repeat_end_type').value;
      document.getElementById('endDateField').style.display = type === 'date' ? 'block' : 'none';
      document.getElementById('endCountField').style.display = type === 'count' ? 'block' : 'none';
    };

    window.parseNLPRepeat = function(text) {
      text = text.toLowerCase().trim();
      const feedback = document.getElementById('nlpFeedback');
      const freqSelect = document.getElementById('repeat_frequency');
      const intervalInput = document.getElementById('repeat_interval');
      
      if (!text) {
        feedback.style.display = 'none';
        return;
      }
      
      let detected = null;
      
      if (text.includes('every day') || text === 'daily') {
        detected = { frequency: 'daily', interval: 1, desc: 'Every day' };
      } else if (text.match(/every (\d+) days/)) {
        const days = parseInt(text.match(/every (\d+) days/)[1], 10);
        detected = { frequency: 'daily', interval: days, desc: `Every ${days} days` };
      } else if (text.includes('every week') || text === 'weekly') {
        detected = { frequency: 'weekly', interval: 1, desc: 'Every week' };
      } else if (text.match(/every (\d+) weeks/)) {
        const weeks = parseInt(text.match(/every (\d+) weeks/)[1], 10);
        detected = { frequency: 'weekly', interval: weeks, desc: `Every ${weeks} weeks` };
      } else if (text.includes('every friday') || text === 'friday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['FR'], desc: 'Weekly on Friday' };
      } else if (text.includes('every monday') || text === 'monday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['MO'], desc: 'Weekly on Monday' };
      } else if (text.includes('every tuesday') || text === 'tuesday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['TU'], desc: 'Weekly on Tuesday' };
      } else if (text.includes('every wednesday') || text === 'wednesday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['WE'], desc: 'Weekly on Wednesday' };
      } else if (text.includes('every thursday') || text === 'thursday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['TH'], desc: 'Weekly on Thursday' };
      } else if (text.includes('every saturday') || text === 'saturday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['SA'], desc: 'Weekly on Saturday' };
      } else if (text.includes('every sunday') || text === 'sunday') {
        detected = { frequency: 'weekly', interval: 1, weeklyDays: ['SU'], desc: 'Weekly on Sunday' };
      } else if (text.includes('every month') || text === 'monthly') {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfMonth', desc: 'Every month' };
      } else if (text.match(/every (\d+) months/)) {
        const months = parseInt(text.match(/every (\d+) months/)[1], 10);
        detected = { frequency: 'monthly', interval: months, monthlyType: 'dayOfMonth', desc: `Every ${months} months` };
      } else if (text.match(/monthly on the (\d+)/)) {
        const day = parseInt(text.match(/monthly on the (\d+)/)[1], 10);
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfMonth', monthlyDay: day, desc: `Monthly on day ${day}` };
      } else if (text.includes('last friday')) {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfWeek', monthlyWeek: 'last', monthlyDayOfWeek: 'FR', desc: 'Monthly on last Friday' };
      } else if (text.includes('first monday')) {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfWeek', monthlyWeek: 'first', monthlyDayOfWeek: 'MO', desc: 'Monthly on first Monday' };
      }
      
      if (detected) {
        freqSelect.value = detected.frequency;
        intervalInput.value = detected.interval;
        adjustRepeatDetailFields();
        
        if (detected.weeklyDays) {
          document.querySelectorAll('.weekly-day-btn').forEach(btn => {
            btn.checked = detected.weeklyDays.includes(btn.value);
          });
        }
        
        if (detected.monthlyType) {
          document.getElementById('repeat_monthly_type').value = detected.monthlyType;
          adjustMonthlyFields();
          if (detected.monthlyDay) {
            document.getElementById('repeat_monthly_day').value = detected.monthlyDay;
          }
          if (detected.monthlyWeek) {
            document.getElementById('repeat_monthly_week').value = detected.monthlyWeek;
          }
          if (detected.monthlyDayOfWeek) {
            document.getElementById('repeat_monthly_dayofweek').value = detected.monthlyDayOfWeek;
          }
        }
        
        feedback.innerText = `Matched: "${detected.desc}"`;
        feedback.style.display = 'block';
      } else {
        feedback.style.display = 'none';
      }
    };

    window.submitAddTask = async function(e) {
      e.preventDefault();
      const errorDiv = document.getElementById('addTaskError');
      errorDiv.style.display = 'none';

      // Standard single submit via AJAX to support success toast UX
      const payload = {
        client_id: document.getElementById('client_id_input').value,
        task_type_id: document.getElementById('task_type_id_input').value,
        assigned_user_id: document.getElementById('assigned_user_id_input').value,
        due_date: document.getElementById('due_date_input').value,
        tags: hiddenTagsInput.value
      };

      const isRecurring = document.getElementById('repeatTaskToggle').checked;
      if (isRecurring) {
        const weeklyDays = Array.from(document.querySelectorAll('.weekly-day-btn:checked')).map(cb => cb.value);
        payload.recurrence_rule = {
          frequency: document.getElementById('repeat_frequency').value,
          interval: parseInt(document.getElementById('repeat_interval').value || 1, 10),
          weeklyDays,
          monthlyType: document.getElementById('repeat_monthly_type').value,
          monthlyDay: parseInt(document.getElementById('repeat_monthly_day').value || 1, 10),
          monthlyWeek: document.getElementById('repeat_monthly_week').value,
          monthlyDayOfWeek: document.getElementById('repeat_monthly_dayofweek').value,
          endType: document.getElementById('repeat_end_type').value,
          endDate: document.getElementById('repeat_end_date').value,
          endCount: parseInt(document.getElementById('repeat_end_count').value || 10, 10)
        };
      }

      try {
        const response = await fetch('/tasks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
          bootstrap.Modal.getInstance(document.getElementById('newTaskModal'))?.hide();
          document.getElementById('newTaskForm').reset();
          showToast('Action completed successfully!', 'success');
          refreshDashboardTable(data.taskId);
        } else {
          errorDiv.innerText = data.error || 'Failed to create task.';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
      }
    };

    function renderTags() {
      // Remove existing visual tags
      tagInputContainer.querySelectorAll('.visual-tag').forEach(el => el.remove());
      
      // Add visual tags
      currentTags.forEach((tag, index) => {
        const span = document.createElement('span');
        span.className = 'visual-tag badge bg-light text-dark border d-flex align-items-center gap-1 px-2 py-1';
        span.innerHTML = `<span>${tag}</span> <i class="bi bi-x-circle-fill text-muted" style="cursor:pointer;" onclick="removeTag(${index})"></i>`;
        tagInputContainer.insertBefore(span, tagInputField);
      });
      
      hiddenTagsInput.value = JSON.stringify(currentTags);
    }

    window.removeTag = function(index) {
      currentTags.splice(index, 1);
      renderTags();
    };

    if (tagInputField) {
      tagInputField.addEventListener('keydown', function(e) {
        if (e.key === ',' || e.key === 'Enter') {
          e.preventDefault();
          const val = this.value.trim().replace(/,/g, '');
          if (val && !currentTags.includes(val)) {
            currentTags.push(val);
            renderTags();
          }
          this.value = '';
        } else if (e.key === 'Backspace' && this.value === '' && currentTags.length > 0) {
          // Remove last tag if backspacing on empty input
          currentTags.pop();
          renderTags();
        }
      });
    }
  });

  // Common chart options
  Chart.defaults.font.family = "'Inter', sans-serif";
  
  // Make chart text color dynamic based on theme
  const getChartColor = () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#94a3b8' : '#555';
  Chart.defaults.color = getChartColor();
  
  // Listen for theme changes to update chart text colors if needed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-bs-theme') {
        Chart.defaults.color = getChartColor();
        Chart.instances.forEach(chart => chart.update());
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true });

  // Status Chart
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: <%- JSON.stringify(chartData.statusLabels) %>,
      datasets: [{
        data: <%- JSON.stringify(chartData.statusData) %>,
        backgroundColor: ['#f06a2f', '#1a73e8', '#1e8e3e', '#d93025'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '65%'
    }
  });

  // Team Chart
  const teamCtx = document.getElementById('teamChart').getContext('2d');
  new Chart(teamCtx, {
    type: 'bar',
    data: {
      labels: <%- JSON.stringify(chartData.teamLabels) %>,
      datasets: [{
        label: 'Tasks',
        data: <%- JSON.stringify(chartData.teamData) %>,
        backgroundColor: '#404347',
          borderRadius: 4,
          maxBarThickness: 35
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  // Type Chart
  const typeCtx = document.getElementById('typeChart').getContext('2d');
  new Chart(typeCtx, {
    type: 'bar',
    data: {
      labels: <%- JSON.stringify(chartData.typeLabels) %>,
      datasets: [{
        label: 'Tasks',
        data: <%- JSON.stringify(chartData.typeData) %>,
        backgroundColor: '#5f6368',
          borderRadius: 4,
          maxBarThickness: 35
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  // Calendar Logic
  const allTasks = <%- JSON.stringify(tasks) %>;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let selectedDateString = null;

  function switchTaskView(view) {
    const listBtns = document.querySelectorAll('.btnListView');
    const calBtns = document.querySelectorAll('.btnCalendarView');
    const listView = document.getElementById('listView');
    const calView = document.getElementById('calendarView');
    
    if (view === 'list') {
      listBtns.forEach(btn => btn.className = 'btn btn-sm btn-dark btnListView');
      calBtns.forEach(btn => btn.className = 'btn btn-sm btn-outline-secondary btnCalendarView');
      listView.classList.remove('d-none');
      calView.classList.add('d-none');
    } else {
      calBtns.forEach(btn => btn.className = 'btn btn-sm btn-dark btnCalendarView');
      listBtns.forEach(btn => btn.className = 'btn btn-sm btn-outline-secondary btnListView');
      calView.classList.remove('d-none');
      listView.classList.add('d-none');
      renderCalendar();
    }
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    } else if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  }

  function renderCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendarMonthYear').innerText = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(createDayCell(currentYear, currentMonth - 1, daysInPrevMonth - firstDay + i + 1, true));
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.appendChild(createDayCell(currentYear, currentMonth, i, false));
    }
    
    // Next month padding (to complete 42 cells grid if needed, or just fill the last row)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
      grid.appendChild(createDayCell(currentYear, currentMonth + 1, i, true));
    }
  }

  function createDayCell(year, month, day, isOtherMonth) {
    // Handle month overflow/underflow internally for date string matching
    let adjYear = year;
    let adjMonth = month;
    if (adjMonth < 0) { adjMonth = 11; adjYear--; }
    else if (adjMonth > 11) { adjMonth = 0; adjYear++; }
    
    const dateStr = `${adjYear}-${String(adjMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const el = document.createElement('div');
    el.className = `calendar-day ${isOtherMonth ? 'other-month' : ''}`;
    if (selectedDateString === dateStr) el.classList.add('active-day');
    
    el.innerHTML = `<div class="calendar-day-number">${day}</div>`;
    
    // Find tasks for this day
    const dayTasks = allTasks.filter(t => t.due_date === dateStr);
    
    // Responsive: Draw simple dots on mobile (<768px wide) instead of text blocks
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      if (dayTasks.length > 0) {
        let dotsHtml = '<div class="d-flex justify-content-center gap-1 mt-auto flex-wrap">';
        dayTasks.slice(0, 3).forEach(t => {
          let dotColor = '#6b7280'; // text-muted
          if (t.status === 'Completed') dotColor = '#1e8e3e';
          else if (t.status === 'Overdue') dotColor = '#d93025';
          else if (t.status === 'In Progress') dotColor = '#1a73e8';
          dotsHtml += `<span style="width: 5px; height: 5px; border-radius: 50%; background-color: ${dotColor}; display: inline-block;"></span>`;
        });
        dotsHtml += '</div>';
        el.innerHTML += dotsHtml;
      }
    } else {
      // Desktop: Display up to 3 task text bars
      dayTasks.slice(0, 3).forEach(t => {
        let bgClass = 'bg-secondary text-white';
        if (t.status === 'Completed') bgClass = 'bg-success text-white';
        else if (t.status === 'Overdue') bgClass = 'bg-danger text-white';
        else if (t.status === 'In Progress') bgClass = 'bg-primary text-white';
        
        const title = t.TaskType ? t.TaskType.name : 'Task';
        el.innerHTML += `<div class="calendar-task-bar ${bgClass}">${title}</div>`;
      });
      
      if (dayTasks.length > 3) {
        el.innerHTML += `<div class="text-muted" style="font-size:0.65rem; font-weight:600;">+${dayTasks.length - 3} more</div>`;
      }
    }
    
    el.onclick = () => selectDay(dateStr, dayTasks);
    return el;
  }

  function selectDay(dateStr, dayTasks) {
    selectedDateString = dateStr;
    renderCalendar(); // Refresh to show active state
    
    const parts = dateStr.split('-');
    let dateLabel = dateStr;
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateLabel = `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }
    document.getElementById('selectedDayTitle').innerText = dateLabel;
    
    const container = document.getElementById('selectedDayTasks');
    container.innerHTML = '';
    
    if (dayTasks.length === 0) {
      container.innerHTML = `<div class="text-muted small">No tasks scheduled for this day.</div>`;
      return;
    }
    
    dayTasks.forEach(t => {
      const typeName = t.TaskType ? t.TaskType.name : 'Unknown Task';
      const clientName = t.Client ? t.Client.name : 'Internal';
      const assigneeName = t.Assignee ? t.Assignee.name : 'Unassigned';
      
      let badgeClass = 'text-muted border-secondary';
      if (t.status === 'Completed') badgeClass = 'text-success border-success';
      else if (t.status === 'Overdue') badgeClass = 'text-danger border-danger';
      else if (t.status === 'In Progress') badgeClass = 'text-primary border-primary';
      
      container.innerHTML += `
        <div class="p-3 border rounded" style="background-color: var(--bg-color);">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="fw-bold mb-0">${typeName}</h6>
            <span class="badge bg-transparent border ${badgeClass}" style="font-size: 0.65rem;">${t.status}</span>
          </div>
          <div class="text-muted small mb-2">${clientName} &middot; ${assigneeName}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary py-0" style="font-size: 0.7rem;" onclick="openTaskModal('${t.id}')">EDIT</button>
          </div>
        </div>
      `;
    });
  }

  function submitDashboardFilters() {
    const form = document.getElementById('filterForm');
    const timeSelect = document.getElementById('timeFilterSelect').value;
    if (timeSelect === 'custom') {
      const start = form.querySelector('[name="start_date"]').value;
      const end = form.querySelector('[name="end_date"]').value;
      if (!start || !end) return; // wait until they pick both dates
    }
    form.submit();
  }

  // --- KEYBOARD SHORTCUTS ---
  let currentFocusedTaskIndex = -1;  function playChimeSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      function playNote(freq, startTime, duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      }
      
      const now = ctx.currentTime;
      playNote(523.25, now, 1); // C5
      playNote(659.25, now + 0.1, 1); // E5
      playNote(783.99, now + 0.2, 1.5); // G5
    } catch(e) { console.error(e); }
  }

  async function refreshDashboardTable(taskIdToHighlight = null) {
    try {
      const res = await fetch(window.location.href);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newTbody = doc.querySelector('.table tbody');
      const oldTbody = document.querySelector('.table tbody');
      if (newTbody && oldTbody) oldTbody.innerHTML = newTbody.innerHTML;
      
      const newKpis = Array.from(doc.querySelectorAll('.row.mb-4')).find(r => r.innerHTML.includes('Total Tasks'));
      const oldKpis = Array.from(document.querySelectorAll('.row.mb-4')).find(r => r.innerHTML.includes('Total Tasks'));
      if (newKpis && oldKpis) oldKpis.innerHTML = newKpis.innerHTML;
      
      if (taskIdToHighlight) {
        const checkbox = document.querySelector(`.row-checkbox[value="${taskIdToHighlight}"]`);
        if (checkbox) {
          const tr = checkbox.closest('tr');
          if (tr) {
            tr.style.backgroundColor = '#d4edda';
            tr.style.transition = 'background-color 1s ease-out';
            setTimeout(() => {
              tr.style.backgroundColor = '';
            }, 10000);
          }
        }
      }
    } catch(e) {
      console.error(e);
      window.location.reload();
    }
  }

  const globalArchiveRule = '<%= archiveRule %>';

  function triggerCompleteEffects(taskId) {
    if (typeof confetti !== 'undefined') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    playChimeSound();
    
    let row = null;
    let taskText = 'Task';
    
    if (taskId) {
      const rows = document.querySelectorAll('.dashboard-task-row');
      rows.forEach(r => {
        const cb = r.querySelector('.row-checkbox');
        if (cb && cb.value === taskId) {
          row = r;
          // Extract text for toast: Client Name - Task Name
          const clientCell = r.querySelector('td:nth-child(2)');
          const taskCell = r.querySelector('td:nth-child(3)');
          const clientName = clientCell ? clientCell.innerText.trim() : '';
          const taskName = taskCell ? taskCell.innerText.trim() : '';
          if (clientName && taskName) taskText = `${clientName} - ${taskName}`;
          else if (taskName) taskText = taskName;
        }
      });
    }

    if (row) {
      row.classList.add('task-complete-anim');
      
      if (globalArchiveRule === '0') {
        setTimeout(() => {
          row.classList.remove('task-complete-anim');
          row.classList.add('task-complete-anim-fadeout');
          setTimeout(() => {
            row.style.display = 'none'; // hide it
            showToast(`${taskText} has been moved to archives`, 'success');
            // Inform backend to archive immediately
            fetch(`/tasks/${taskId}/archive-immediate`, { method: 'POST' }).then(() => {
              refreshDashboardTable();
            });
          }, 500);
        }, 5000);
      } else {
        setTimeout(() => {
          row.classList.remove('task-complete-anim');
          row.classList.add('task-complete-anim-fadeout');
          setTimeout(() => {
            row.classList.remove('task-complete-anim-fadeout');
            showToast('Task status updated!', 'success');
            refreshDashboardTable();
          }, 2000);
        }, 500);
      }
    } else {
      if (globalArchiveRule === '0') {
        setTimeout(() => {
          fetch(`/tasks/${taskId}/archive-immediate`, { method: 'POST' }).then(() => {
            reloadWithSuccess('Task moved to archives!');
          });
        }, 5000);
      } else {
        setTimeout(() => reloadWithSuccess('Task status updated!'), 1500);
      }
    }
  }

  async function quickMarkComplete(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Toggle status between 'Completed' and 'In Progress'
    const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    
    const payload = {
      status: newStatus,
      client_id: task.client_id || '',
      task_type_id: task.task_type_id || '',
      assigned_user_id: task.assigned_user_id || '',
      due_date: task.due_date || '',
      tags: (task.tags || []).join(', ')
    };

    try {
      const response = await fetch('/tasks/' + taskId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        if (newStatus === 'Completed') {
          triggerCompleteEffects(taskId);
        } else {
          reloadWithSuccess('Task status updated!');
        }
      }
    } catch(err) {
      console.error(err);
    }
  }

  function updateShortcutFooterState(state) {
    const shortcutFooter = document.getElementById('shortcutFooter');
    if (!shortcutFooter) return;
    const defaultShortcuts = shortcutFooter.querySelector('.shortcut-default');
    const modalShortcuts = shortcutFooter.querySelector('.shortcut-modal');
    const rowShortcuts = shortcutFooter.querySelector('.shortcut-row-focus');

    [defaultShortcuts, modalShortcuts, rowShortcuts].forEach(el => {
      if (el) { el.classList.add('d-none'); el.classList.remove('d-flex'); }
    });

    if (state === 'modal' && modalShortcuts) {
      modalShortcuts.classList.remove('d-none');
      modalShortcuts.classList.add('d-flex');
    } else if (state === 'row' && rowShortcuts) {
      rowShortcuts.classList.remove('d-none');
      rowShortcuts.classList.add('d-flex');
    } else if (defaultShortcuts) {
      defaultShortcuts.classList.remove('d-none');
      defaultShortcuts.classList.add('d-flex');
    }
  }

  document.addEventListener('keydown', function(e) {
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
    }

    const isAnyModalOpen = document.querySelector('.modal.show') !== null;
    if (isAnyModalOpen) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
          const form = activeModal.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
          }
        }
      }
      return; 
    }

    const taskRows = Array.from(document.querySelectorAll('.dashboard-task-row'));
    if (taskRows.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentFocusedTaskIndex < taskRows.length - 1) {
          if (currentFocusedTaskIndex >= 0) taskRows[currentFocusedTaskIndex].classList.remove('keyboard-focused');
          currentFocusedTaskIndex++;
          taskRows[currentFocusedTaskIndex].classList.add('keyboard-focused');
          taskRows[currentFocusedTaskIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          updateShortcutFooterState('row');
        }
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentFocusedTaskIndex > 0) {
          taskRows[currentFocusedTaskIndex].classList.remove('keyboard-focused');
          currentFocusedTaskIndex--;
          taskRows[currentFocusedTaskIndex].classList.add('keyboard-focused');
          taskRows[currentFocusedTaskIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          updateShortcutFooterState('row');
        } else if (currentFocusedTaskIndex === 0) {
          taskRows[currentFocusedTaskIndex].classList.remove('keyboard-focused');
          currentFocusedTaskIndex = -1;
          updateShortcutFooterState('default');
        }
        return;
      }
    }

    if (currentFocusedTaskIndex >= 0 && currentFocusedTaskIndex < taskRows.length) {
      const focusedRow = taskRows[currentFocusedTaskIndex];
      
      if (e.key === ' ') { // Space
        e.preventDefault();
        const cb = focusedRow.querySelector('.row-checkbox');
        if (cb) {
          cb.checked = !cb.checked;
          cb.dispatchEvent(new Event('change'));
        }
        return;
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const cb = focusedRow.querySelector('.row-checkbox');
        if (cb) openTaskModal(cb.value);
        return;
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const cb = focusedRow.querySelector('.row-checkbox');
        if (cb) quickMarkComplete(cb.value);
        return;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const delBtn = focusedRow.querySelector('.bi-trash');
        if (delBtn) delBtn.click();
        return;
      }
    }

    // Global Shortcuts
    if (e.key === 'c' || e.key === 'n') {
      e.preventDefault();
      const newTaskBtn = document.querySelector('[data-bs-target="#newTaskModal"]');
      if (newTaskBtn) {
        newTaskBtn.click();
        setTimeout(() => {
          const clientSelectBtn = document.getElementById('clientSelectBtn');
          if (clientSelectBtn) clientSelectBtn.focus();
        }, 300);
      }
    } else if (e.key === '/') {
      e.preventDefault();
      const searchInput = document.getElementById('dashboardSearch');
      if (searchInput) searchInput.focus();
    } else if (e.key === 'v') {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.search);
      const currentView = urlParams.get('task_view') || 'list';
      if (currentView === 'list') {
        const calBtn = document.querySelector('.btnCalendarView');
        if(calBtn) calBtn.click();
      } else {
        const listBtn = document.querySelector('.btnListView');
        if(listBtn) listBtn.click();
      }
    } else if (e.key === 'f') {
      e.preventDefault();
      const clientFilter = document.querySelector('select[name="client_id"]'); 
      if (clientFilter) clientFilter.focus();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Checkbox highlighting logic
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('row-checkbox')) {
        const row = e.target.closest('.dashboard-task-row');
        if (row) {
          if (e.target.checked) row.classList.add('task-selected');
          else row.classList.remove('task-selected');
        }
      } else if (e.target.classList.contains('master-checkbox')) {
        const isChecked = e.target.checked;
        document.querySelectorAll('.dashboard-task-row').forEach(row => {
          const cb = row.querySelector('.row-checkbox');
          if (cb) {
            if (isChecked) row.classList.add('task-selected');
            else row.classList.remove('task-selected');
          }
        });
      }
    });

    const shortcutFooter = document.getElementById('shortcutFooter');
    if (shortcutFooter) {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('show.bs.modal', () => {
          updateShortcutFooterState('modal');
        });
        modal.addEventListener('hidden.bs.modal', () => {
          setTimeout(() => {
            if (!document.querySelector('.modal.show')) {
              updateShortcutFooterState(currentFocusedTaskIndex >= 0 ? 'row' : 'default');
            }
          }, 50);
        });
      });
    }
    // Highlight newly created or edited task
    const highlightTaskId = sessionStorage.getItem('highlightTask');
    if (highlightTaskId) {
      sessionStorage.removeItem('highlightTask');
      // Find the row via the checkbox value
      const checkbox = document.querySelector(`.row-checkbox[value="${highlightTaskId}"]`);
      if (checkbox) {
        const tr = checkbox.closest('tr');
        if (tr) {
          tr.style.backgroundColor = '#d4edda';
          tr.style.transition = 'background-color 1s ease-out';
          setTimeout(() => {
            tr.style.backgroundColor = '';
          }, 10000);
        }
      }
    }
  }); // End DOMContentLoaded
