const fs = require('fs');

// 1. Update exportExcel() in dashboard.ejs
let ejsFile = 'views/pages/dashboard.ejs';
let ejs = fs.readFileSync(ejsFile, 'utf8');

const targetFunc = `function exportExcel() {
    const query = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput && searchInput.value) {
      query.set('search', searchInput.value);
    }
    window.location.href = '/tasks/export?' + query.toString();
  }`;

const newFunc = `function exportExcel() {
    const query = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput && searchInput.value) {
      query.set('search', searchInput.value);
    }
    if (typeof currentSortCol !== 'undefined') {
      query.set('sortCol', currentSortCol);
      query.set('sortDir', currentSortDir || 'asc');
    }
    window.location.href = '/tasks/export?' + query.toString();
  }`;

if (ejs.includes(targetFunc)) {
  ejs = ejs.replace(targetFunc, newFunc);
  fs.writeFileSync(ejsFile, ejs, 'utf8');
  console.log('dashboard.ejs exportExcel patched.');
} else {
  console.log('Failed to patch exportExcel in dashboard.ejs');
}

// 2. Update exportTasks in taskController.js
let controllerFile = 'controllers/taskController.js';
let controller = fs.readFileSync(controllerFile, 'utf8');

const oldSort = `    // Sort tasks by due_date ascending
    tasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

    const [clientsSnap, typesSnap, usersSnap] = await Promise.all([`;

const newSort = `    const [clientsSnap, typesSnap, usersSnap] = await Promise.all([`;

const oldLoop = `    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    
    tasks.forEach(task => {
      const clientName = task.client_id && clientMap[task.client_id] ? clientMap[task.client_id].name : '-';
      const taskName = task.task_type_id && typeMap[task.task_type_id] ? typeMap[task.task_type_id].name : '-';
      const assigneeName = task.assigned_user_id && userMap[task.assigned_user_id] ? userMap[task.assigned_user_id].name : '-';
      
      if (searchTerm) {
        const rowText = \`\${clientName} \${taskName} \${assigneeName} \${task.due_date} \${task.status}\`.toLowerCase();
        if (!rowText.includes(searchTerm)) return;
      }

      worksheet.addRow({
        client: clientName,
        task: taskName,
        assignee: assigneeName,
        due_date: task.due_date,
        status: task.status
      });
    });`;

const newLoop = `    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    
    let exportRows = [];
    tasks.forEach(task => {
      const clientName = task.client_id && clientMap[task.client_id] ? clientMap[task.client_id].name : '-';
      const taskName = task.task_type_id && typeMap[task.task_type_id] ? typeMap[task.task_type_id].name : '-';
      const assigneeName = task.assigned_user_id && userMap[task.assigned_user_id] ? userMap[task.assigned_user_id].name : '-';
      
      if (searchTerm) {
        const rowText = \`\${clientName} \${taskName} \${assigneeName} \${task.due_date} \${task.status}\`.toLowerCase();
        if (!rowText.includes(searchTerm)) return;
      }

      exportRows.push({
        client: clientName,
        task: taskName,
        assignee: assigneeName,
        due_date: task.due_date || '',
        status: task.status || ''
      });
    });

    // Apply sorting to match the client table
    const sortColIdx = req.query.sortCol ? parseInt(req.query.sortCol, 10) : 3;
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;
    
    exportRows.sort((a, b) => {
      let valA = '';
      let valB = '';
      
      if (sortColIdx === 0) { valA = a.client; valB = b.client; }
      else if (sortColIdx === 1) { valA = a.task; valB = b.task; }
      else if (sortColIdx === 2) { valA = a.assignee; valB = b.assignee; }
      else if (sortColIdx === 3) { valA = a.due_date; valB = b.due_date; }
      else if (sortColIdx === 4) { valA = a.status; valB = b.status; }
      
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
      
      if (valA < valB) return -1 * sortDir;
      if (valA > valB) return 1 * sortDir;
      return 0;
    });

    exportRows.forEach(row => worksheet.addRow(row));`;

if (controller.includes(oldSort) && controller.includes(oldLoop)) {
  controller = controller.replace(oldSort, newSort);
  controller = controller.replace(oldLoop, newLoop);
  fs.writeFileSync(controllerFile, controller, 'utf8');
  console.log('taskController export sorting patched.');
} else {
  console.log('Failed to patch taskController sorting.');
}
