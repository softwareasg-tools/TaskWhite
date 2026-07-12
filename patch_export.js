const fs = require('fs');

// 1. Update exportTasks in taskController.js
let controllerFile = 'controllers/taskController.js';
let controller = fs.readFileSync(controllerFile, 'utf8');

const targetLoop = `    tasks.forEach(task => {
      worksheet.addRow({
        client: task.client_id && clientMap[task.client_id] ? clientMap[task.client_id].name : '-',
        task: task.task_type_id && typeMap[task.task_type_id] ? typeMap[task.task_type_id].name : '-',
        assignee: task.assigned_user_id && userMap[task.assigned_user_id] ? userMap[task.assigned_user_id].name : '-',
        due_date: task.due_date,
        status: task.status
      });
    });`;

const newLoop = `    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    
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

if (controller.includes(targetLoop)) {
  controller = controller.replace(targetLoop, newLoop);
  fs.writeFileSync(controllerFile, controller, 'utf8');
  console.log('taskController patched.');
} else {
  console.log('Failed to patch taskController.');
}

// 2. Update exportExcel() in dashboard.ejs
let ejsFile = 'views/pages/dashboard.ejs';
let ejs = fs.readFileSync(ejsFile, 'utf8');

const targetFunc = `function exportExcel() {
      const query = window.location.search;
      window.location.href = '/tasks/export' + query;
    }`;

const newFunc = `function exportExcel() {
      const query = new URLSearchParams(window.location.search);
      const searchInput = document.getElementById('dashboardSearch');
      if (searchInput && searchInput.value) {
        query.set('search', searchInput.value);
      }
      window.location.href = '/tasks/export?' + query.toString();
    }`;

if (ejs.includes(targetFunc)) {
  ejs = ejs.replace(targetFunc, newFunc);
  fs.writeFileSync(ejsFile, ejs, 'utf8');
  console.log('dashboard.ejs patched.');
} else {
  console.log('Failed to patch dashboard.ejs');
}
