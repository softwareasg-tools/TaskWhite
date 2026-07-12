const fs = require('fs');
const file = 'views/pages/dashboard.ejs';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix header indices and add data-col attribute for targeting
content = content.replace(
  /<th onclick="sortTable\(1\)" style="cursor: pointer;">Client <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0\.8em;"><\/i><\/th>/,
  `<th onclick="sortTable(1)" data-col="1" class="sort-header" style="cursor: pointer;">Client <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0.8em;"></i></th>`
);
content = content.replace(
  /<th onclick="sortTable\(1\)" style="cursor: pointer;">Task <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0\.8em;"><\/i><\/th>/,
  `<th onclick="sortTable(2)" data-col="2" class="sort-header" style="cursor: pointer;">Task <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0.8em;"></i></th>`
);
content = content.replace(
  /<th onclick="sortTable\(2\)" style="cursor: pointer;">Assigned To <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0\.8em;"><\/i><\/th>/,
  `<th onclick="sortTable(3)" data-col="3" class="sort-header" style="cursor: pointer;">Assigned To <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0.8em;"></i></th>`
);
content = content.replace(
  /<th onclick="sortTable\(3\)" style="cursor: pointer; color: var\(--bs-primary\) !important;">Due Date <i class="bi bi-sort-down ms-1" style="font-size: 1em;"><\/i><\/th>/,
  `<th onclick="sortTable(4)" data-col="4" class="sort-header" style="cursor: pointer; color: var(--bs-primary) !important;">Due Date <i class="bi bi-sort-down ms-1" style="font-size: 1em;"></i></th>`
);
content = content.replace(
  /<th onclick="sortTable\(4\)" style="cursor: pointer;">Status <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0\.8em;"><\/i><\/th>/,
  `<th onclick="sortTable(5)" data-col="5" class="sort-header" style="cursor: pointer;">Status <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0.8em;"></i></th>`
);
content = content.replace(
  /<th onclick="sortByActionDate\(\)" class="text-end" style="cursor: pointer;">Actions <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0\.8em;"><\/i><\/th>/,
  `<th onclick="sortByActionDate()" data-col="6" class="sort-header text-end" style="cursor: pointer;">Actions <i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 0.8em;"></i></th>`
);

// 2. Add visual update helper function
const helperFunc = `
  function updateSortVisuals(colIndex, dir) {
    const headers = document.querySelectorAll('th.sort-header');
    headers.forEach(th => {
      th.style.color = ''; // Reset color
      const icon = th.querySelector('i.bi');
      if (icon) {
        icon.className = 'bi bi-arrow-down-up text-muted ms-1';
        icon.style.fontSize = '0.8em';
      }
    });

    const activeTh = document.querySelector(\`th.sort-header[data-col="\${colIndex}"]\`);
    if (activeTh) {
      activeTh.style.setProperty('color', 'var(--bs-primary)', 'important');
      const icon = activeTh.querySelector('i.bi');
      if (icon) {
        icon.className = dir === 'asc' ? 'bi bi-sort-down ms-1' : 'bi bi-sort-up ms-1';
        icon.style.fontSize = '1em';
      }
    }
  }
`;
if (!content.includes('updateSortVisuals(')) {
   content = content.replace('function sortTable(n) {', helperFunc + '\n  function sortTable(n) {');
}

// 3. Inject visual update calls in sortTable and sortByActionDate
content = content.replace(
  /tbody\.append\(\.\.\.rows\);\s*\}/,
  `tbody.append(...rows);\n    updateSortVisuals(n, currentSortDir);\n  }`
);

// For sortByActionDate, we need to add the visual update logic and track direction
content = content.replace(
  /function sortByActionDate\(\) \{/,
  `let actionSortDir = 'asc';\n  function sortByActionDate() {\n    actionSortDir = actionSortDir === 'asc' ? 'desc' : 'asc';\n    updateSortVisuals(6, actionSortDir);`
);

// Change action date sorting to use actionSortDir
content = content.replace(
  /rows\.sort\(\(a, b\) => \{\s*const aTime = parseInt\(a\.getAttribute\('data-action-time'\)\);\s*const bTime = parseInt\(b\.getAttribute\('data-action-time'\)\);\s*return bTime - aTime;\s*\}\);/,
  `rows.sort((a, b) => {
      const aTime = parseInt(a.getAttribute('data-action-time'));
      const bTime = parseInt(b.getAttribute('data-action-time'));
      return actionSortDir === 'asc' ? aTime - bTime : bTime - aTime;
    });`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Sort logic patched.');
