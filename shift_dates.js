const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbPath = process.argv[2] || path.join(__dirname, 'database.sqlite');
console.log('Using database at:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error(`ERROR: Database file not found at ${dbPath}`);
  process.exit(1);
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

async function run() {
  try {
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables found in DB:', tables.map(t => t.name));

    const taskTableObj = tables.find(t => t.name.toLowerCase() === 'tasks' || t.name.toLowerCase() === 'task');
    if (!taskTableObj) {
      console.error('No tasks/Task table found in this database!');
      return;
    }

    const tableName = taskTableObj.name;
    console.log(`Using table name: "${tableName}"`);

    const Task = sequelize.define('Task', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      status: { type: Sequelize.STRING },
      due_date: { type: Sequelize.DATEONLY }
    }, {
      tableName: tableName,
      timestamps: false
    });

    const tasks = await Task.findAll();
    console.log('Found tasks:', tasks.length);

    let updatedCount = 0;
    for (let task of tasks) {
      let day;
      if (task.status === 'Overdue') {
        day = Math.floor(Math.random() * 14) + 1;
      } else if (task.status === 'Assigned' || task.status === 'In Progress') {
        day = Math.floor(Math.random() * 16) + 16;
      } else {
        day = Math.floor(Math.random() * 31) + 1;
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
