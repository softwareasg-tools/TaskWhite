const fs = require('fs');
const file = 'views/pages/dashboard.ejs';
let content = fs.readFileSync(file, 'utf8');

// 1. Export Excel button - icon only on mobile
content = content.replace(
  /<button class="btn btn-sm btn-outline-success d-flex align-items-center gap-2" onclick="exportToExcel\(\)">\s*<i class="bi bi-file-earmark-excel"><\/i> Export Excel\s*<\/button>/,
  `<button class="btn btn-sm btn-outline-success d-flex align-items-center gap-2" onclick="exportToExcel()" title="Export Excel">\n          <i class="bi bi-file-earmark-excel"></i> <span class="d-none d-md-inline">Export Excel</span>\n        </button>`
);

// 2. New Task button - hide on mobile
content = content.replace(
  /<button class="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm" data-bs-toggle="modal" data-bs-target="#newTaskModal">/,
  `<button class="btn btn-sm btn-primary d-none d-md-flex align-items-center gap-2 shadow-sm" data-bs-toggle="modal" data-bs-target="#newTaskModal">`
);

// 3. Flatpickr - add disableMobile: true
content = content.replace(
  /flatpickr\("#due_date_input", \{ dateFormat: "Y-m-d", allowInput: false \}\);/g,
  `flatpickr("#due_date_input", { dateFormat: "Y-m-d", allowInput: false, disableMobile: true });`
);
content = content.replace(
  /flatpickr\("#repeat_end_date", \{ dateFormat: "Y-m-d", allowInput: false \}\);/g,
  `flatpickr("#repeat_end_date", { dateFormat: "Y-m-d", allowInput: false, disableMobile: true });`
);
content = content.replace(
  /flatpickr\("#filter_start_date", \{ dateFormat: "Y-m-d", allowInput: false \}\);/g,
  `flatpickr("#filter_start_date", { dateFormat: "Y-m-d", allowInput: false, disableMobile: true });`
);
content = content.replace(
  /flatpickr\("#filter_end_date", \{ dateFormat: "Y-m-d", allowInput: false \}\);/g,
  `flatpickr("#filter_end_date", { dateFormat: "Y-m-d", allowInput: false, disableMobile: true });`
);
content = content.replace(
  /flatpickr\("#edit_due_date_input", \{ dateFormat: "Y-m-d", allowInput: false \}\);/g,
  `flatpickr("#edit_due_date_input", { dateFormat: "Y-m-d", allowInput: false, disableMobile: true });`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboard patched for mobile view fixes.');
