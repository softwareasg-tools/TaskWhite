const { Sequelize } = require('sequelize');
const sequelize = require('./config/database');
const Task = require('./models/Task');

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
    console.error('Error shifting dates:', err);
  } finally {
    await sequelize.close();
  }
}
run();
