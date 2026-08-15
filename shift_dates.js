const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Allow overriding the database path via command line argument, default to database.sqlite in current dir
const dbPath = process.argv[2] || path.join(__dirname, 'database.sqlite');
console.log('Using database at:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error(`ERROR: Database file not found at ${dbPath}`);
  console.error(`Please provide the correct path to your production database.sqlite as an argument.`);
  console.error(`Example: node shift_dates.js /var/www/taskwhite/database.sqlite`);
  process.exit(1);
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

const Task = sequelize.define('Task', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  status: { type: Sequelize.STRING },
  due_date: { type: Sequelize.DATEONLY }
}, {
  tableName: 'tasks',
  timestamps: false
});

async function run() {
  try {
    const tasks = await Task.findAll();
    console.log('Found tasks:', tasks.length);

    let updatedCount = 0;
    for (let task of tasks) {
      let day;
      if (task.status === 'Overdue') {
        day = Math.floor(Math.random() * 14) + 1; // 1 to 14
      } else if (task.status === 'Assigned' || task.status === 'In Progress') {
        day = Math.floor(Math.random() * 16) + 16; // 16 to 31
      } else {
        day = Math.floor(Math.random() * 31) + 1; // 1 to 31
      }
      const dateStr = `2026-08-${day.toString().padStart(2, '0')}`;
      
      task.due_date = dateStr;
      await task.save();
      updatedCount++;
    }
    console.log(`Successfully shifted dates for ${updatedCount} tasks to August 2026 for the demo.`);
  } catch (err) {
    console.error('Error shifting dates:', err.message);
  } finally {
    await sequelize.close();
  }
}
run();
