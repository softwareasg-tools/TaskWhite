const fs = require('fs');

let ejs = fs.readFileSync('views/pages/dashboard.ejs', 'utf-8');

// Rename titles
ejs = ejs.replace('<div class="card-header">Tasks by Employee</div>', '<div class="card-header fw-bold text-muted small">TASK COUNT BY TEAM MEMBER</div>');
ejs = ejs.replace('<div class="card-header">Tasks by Task</div>', '<div class="card-header fw-bold text-muted small">TASK COUNT</div>');

// The original ones might not have the fw-bold classes, let's just do a plain string replace for safety in case they do.
ejs = ejs.replace(/Tasks by Employee/g, 'TASK COUNT BY TEAM MEMBER');
ejs = ejs.replace(/Tasks by Task/g, 'TASK COUNT');

// Add maxBarThickness to teamChart
ejs = ejs.replace(/backgroundColor:\s*'#404347',\s*borderRadius:\s*4/g, "backgroundColor: '#404347',\n          borderRadius: 4,\n          maxBarThickness: 35");

// Add maxBarThickness to typeChart
ejs = ejs.replace(/backgroundColor:\s*'#5f6368',\s*borderRadius:\s*4/g, "backgroundColor: '#5f6368',\n          borderRadius: 4,\n          maxBarThickness: 35");


fs.writeFileSync('views/pages/dashboard.ejs', ejs);
console.log('Updated charts!');
