const cron = require('node-cron');
const { getFirestore } = require('firebase-admin/firestore');

function initCronJobs() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily task cleanup job for Task Archives...');
    try {
      const db = getFirestore();
      
      // Fetch all organizations to get their archive_tasks_days settings
      const orgsSnap = await db.collection('organizations').get();
      const orgSettings = {};
      orgsSnap.forEach(doc => {
        const data = doc.data();
        const rule = data.archive_tasks_days || '30';
        if (rule !== 'Never') {
          orgSettings[doc.id] = parseInt(rule, 10);
        }
      });

      if (Object.keys(orgSettings).length === 0) {
        console.log('No organizations have archive_tasks_days configured. Exiting job.');
        return;
      }

      // Fetch all completed tasks that are not yet deleted and not archived
      const completedTasksSnap = await db.collection('tasks')
        .where('status', '==', 'Completed')
        .where('deleted_at', '==', null)
        .where('is_archived', '==', false) // assuming we set this or it's empty
        .get();

      // If is_archived is undefined in Firestore, the equality filter `== false` might miss them!
      // To be safe against old docs, we just fetch all completed non-deleted tasks and filter.
      const allCompletedTasksSnap = await db.collection('tasks')
        .where('status', '==', 'Completed')
        .where('deleted_at', '==', null)
        .get();

      const batch = db.batch();
      let archiveCount = 0;
      const today = new Date();

      allCompletedTasksSnap.forEach(doc => {
        const task = doc.data();
        
        // Skip if already archived
        if (task.is_archived) return;

        const orgArchiveDays = orgSettings[task.organization_id];

        if (orgArchiveDays && task.completed_at) {
          let completedDate;
          
          if (task.completed_at.toDate) {
            completedDate = task.completed_at.toDate();
          } else {
            completedDate = new Date(task.completed_at);
          }
          
          const diffTime = Math.abs(today - completedDate);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= orgArchiveDays) {
            batch.update(doc.ref, {
              is_archived: true
            });
            archiveCount++;
          }
        }
      });

      if (archiveCount > 0) {
        await batch.commit();
        console.log(`Successfully archived ${archiveCount} old completed tasks.`);
      } else {
        console.log('No tasks met the criteria for auto-archiving.');
      }
    } catch (err) {
      console.error('Error during daily task cleanup:', err);
    }
  });
  console.log('Cron jobs initialized.');
}

module.exports = { initCronJobs };
