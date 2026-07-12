const fs = require('fs');

// 1. Fix layout.ejs bottom padding for mobile
let layout = fs.readFileSync('views/layout.ejs', 'utf8');
if (!layout.includes('bottom-nav-spacer')) {
  layout = layout.replace(
    '<!-- Mobile Bottom Navigation -->',
    '<div class="bottom-nav-spacer d-lg-none" style="height: 80px;"></div>\n    <!-- Mobile Bottom Navigation -->'
  );
  fs.writeFileSync('views/layout.ejs', layout);
}

// 2. Fix dashboard.ejs buttons again (previous attempt failed)
let dash = fs.readFileSync('views/pages/dashboard.ejs', 'utf8');
dash = dash.replace(
  /<button type="button" class="btn btn-outline-secondary me-2 text-nowrap" onclick="exportExcel\(\)"><i class="bi bi-file-earmark-excel"><\/i> Export Excel<\/button>/,
  '<button type="button" class="btn btn-outline-success me-2 text-nowrap px-2 px-md-3" onclick="exportExcel()" title="Export Excel"><i class="bi bi-file-earmark-excel"></i> <span class="d-none d-md-inline">Export Excel</span></button>'
);
dash = dash.replace(
  /<button type="button" class="btn btn-dark text-nowrap" data-bs-toggle="modal" data-bs-target="#newTaskModal"><i class="bi bi-plus"><\/i> New Task<\/button>/,
  '<button type="button" class="btn btn-dark text-nowrap d-none d-md-inline-block" data-bs-toggle="modal" data-bs-target="#newTaskModal"><i class="bi bi-plus"></i> New Task</button>'
);
fs.writeFileSync('views/pages/dashboard.ejs', dash);

// 3. Helper to build mobile cards for archive/recycle
function buildMobileCards(isRecycle) {
  const badgeClass = isRecycle ? 'text-danger border-danger' : 'text-secondary border-secondary';
  const badgeText = isRecycle ? 'Deleted' : 'Archived';
  const actionIcon = isRecycle ? 'bi-arrow-counterclockwise' : 'bi-arrow-counterclockwise';
  const actionText = isRecycle ? 'Restore' : 'Unarchive';
  const actionFunc = isRecycle ? 'restoreTask' : 'unarchiveTask';
  
  return `
    <!-- Mobile Tile List View -->
    <div class="d-block d-md-none mt-3">
      <% if (tasks.length === 0) { %>
        <div class="text-center text-muted p-4 bg-surface rounded border">No tasks found.</div>
      <% } %>
      <div class="d-flex flex-column gap-3">
        <% tasks.forEach(task => { %>
          <% 
             const typeName = task.TaskType ? task.TaskType.name : '-';
             const clientName = task.Client ? task.Client.name : '-';
             const assigneeName = task.Assignee ? task.Assignee.name : '-';
          %>
          <div class="dashboard-task-row p-3 border rounded shadow-sm bg-surface">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <h6 class="fw-bold mb-0"><%= typeName %></h6>
              <span class="badge bg-transparent border ${badgeClass}" style="font-size: 0.65rem;">${badgeText}</span>
            </div>
            <div class="opacity-75 small mb-2"><%= clientName %> &middot; <%= assigneeName %></div>
            <div class="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
              <span class="opacity-75 small" style="font-size: 0.75rem;"><i class="bi bi-calendar-event me-1"></i><%= formatAppDate(task.due_date) %></span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary py-1 px-2" style="font-size: 0.7rem;" onclick="event.stopPropagation(); ${actionFunc}('<%= task.id %>')"><i class="bi ${actionIcon}"></i> ${actionText}</button>
              </div>
            </div>
          </div>
        <% }) %>
      </div>
    </div>
  `;
}

// 4. Update task-archives.ejs
let archive = fs.readFileSync('views/pages/task-archives.ejs', 'utf8');
if (!archive.includes('Mobile Tile List View')) {
  // Add search bar
  archive = archive.replace(
    /<div class="d-flex justify-content-between align-items-center mb-4">/,
    `<div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">`
  );
  archive = archive.replace(
    /<\/div>\s*<\/div>\s*<div class="card mb-5">/,
    `</div>\n  </div>\n  <div class="w-100 mt-2">\n    <div class="input-group" style="max-width: 400px;">\n      <span class="input-group-text bg-transparent"><i class="bi bi-search text-muted"></i></span>\n      <input type="text" id="archiveSearch" class="form-control" placeholder="Search archives..." onkeyup="searchTable('archiveSearch')">\n    </div>\n  </div>\n</div>\n<div class="card mb-5">`
  );
  
  // Hide table on mobile and add cards
  archive = archive.replace('<div class="table-responsive">', '<div class="table-responsive d-none d-md-block">');
  archive = archive.replace('</div>\n  </div>\n</div>', '</div>\n    ' + buildMobileCards(false) + '\n  </div>\n</div>');
  
  // Add search JS
  archive += `
<script>
  function searchTable(inputId) {
    const term = document.getElementById(inputId).value.toLowerCase();
    
    // Search table rows
    const rows = document.querySelectorAll('.table tbody tr');
    rows.forEach(row => {
      if (row.querySelector('td[colspan]')) return;
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
    
    // Search mobile cards
    const cards = document.querySelectorAll('.d-md-none .dashboard-task-row');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(term) ? '' : 'none';
    });
  }
</script>
`;
  fs.writeFileSync('views/pages/task-archives.ejs', archive);
}

// 5. Update recycle-bin.ejs
let recycle = fs.readFileSync('views/pages/recycle-bin.ejs', 'utf8');
if (!recycle.includes('Mobile Tile List View')) {
  // Add search bar
  recycle = recycle.replace(
    /<div class="d-flex justify-content-between align-items-center mb-4">/,
    `<div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">`
  );
  recycle = recycle.replace(
    /<\/div>\s*<\/div>\s*<div class="card">/,
    `</div>\n  </div>\n  <div class="w-100 mt-2">\n    <div class="input-group" style="max-width: 400px;">\n      <span class="input-group-text bg-transparent"><i class="bi bi-search text-muted"></i></span>\n      <input type="text" id="recycleSearch" class="form-control" placeholder="Search trash..." onkeyup="searchTable('recycleSearch')">\n    </div>\n  </div>\n</div>\n<div class="card">`
  );
  
  // Hide table on mobile and add cards
  recycle = recycle.replace('<div class="table-responsive">', '<div class="table-responsive d-none d-md-block">');
  recycle = recycle.replace('</div>\n  </div>\n</div>', '</div>\n    ' + buildMobileCards(true) + '\n  </div>\n</div>');
  
  // Add search JS
  recycle += `
<script>
  function searchTable(inputId) {
    const term = document.getElementById(inputId).value.toLowerCase();
    
    // Search table rows
    const rows = document.querySelectorAll('.table tbody tr');
    rows.forEach(row => {
      if (row.querySelector('td[colspan]')) return;
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
    
    // Search mobile cards
    const cards = document.querySelectorAll('.d-md-none .dashboard-task-row');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(term) ? '' : 'none';
    });
  }
</script>
`;
  fs.writeFileSync('views/pages/recycle-bin.ejs', recycle);
}

console.log('Mobile view issues fixed.');
