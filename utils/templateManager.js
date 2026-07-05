const { getFirestore, FieldValue } = require('firebase-admin/firestore');

/**
 * Generates tasks from global templates for all clients.
 * Self-healing: checks if tasks already exist for the client + due date, and if not, creates them.
 * Runs once a day, or can be forced (e.g. when a new client is created or template is added).
 */
async function generateTasksFromTemplates(db, orgId, force = false) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Check if already run today for this org (if not forced)
    if (!force) {
      const runRef = db.collection('system_runs').doc(`${orgId}_${todayStr}`);
      const runDoc = await runRef.get();
      if (runDoc.exists) {
        return; // Already run today
      }
    }
    
    // 2. Fetch templates and clients
    const templatesSnap = await db.collection('global_templates').where('organization_id', '==', orgId).get();
    const clientsSnap = await db.collection('clients').where('organization_id', '==', orgId).get();
    
    const templates = templatesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (templates.length === 0 || clients.length === 0) {
      if (!force) {
        await db.collection('system_runs').doc(`${orgId}_${todayStr}`).set({ run_at: FieldValue.serverTimestamp() });
      }
      return;
    }
    
    // 3. Determine target periods
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    let batch = db.batch();
    let writeCount = 0;
    
    for (const template of templates) {
      const rule = template.recurrence_rule;
      if (!rule || rule.frequency !== 'monthly') continue; 
      
      const targetDay = parseInt(rule.monthlyDay || 20, 10);
      
      // Calculate due date for current month
      const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const actualCurrentDay = Math.min(targetDay, lastDayOfCurrentMonth);
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(actualCurrentDay).padStart(2, '0')}`;
      
      let targetDueDate = null;
      if (currentDueDate >= todayStr) {
        // Current month's compliance day hasn't occurred yet, so that's the next upcoming one
        targetDueDate = currentDueDate;
      } else {
        // Current month's compliance day has already passed, so the next upcoming one is next month
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const nextMonth = (currentMonth + 1) % 12;
        const lastDayOfNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
        const actualNextDay = Math.min(targetDay, lastDayOfNextMonth);
        targetDueDate = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(actualNextDay).padStart(2, '0')}`;
      }

      // Self-cleaning: Delete any future compliance tasks that are not the single active upcoming one
      const templateTasksSnap = await db.collection('tasks')
        .where('organization_id', '==', orgId)
        .where('global_template_id', '==', template.id)
        .where('deleted_at', '==', null)
        .get();

      for (const doc of templateTasksSnap.docs) {
        const taskData = doc.data();
        if (taskData.due_date !== targetDueDate && taskData.status !== 'Completed') {
          batch.delete(doc.ref);
          writeCount++;
          if (writeCount >= 400) {
            await batch.commit();
            batch = db.batch();
            writeCount = 0;
          }
        }
      }
      
      const due_date = targetDueDate;
      
      for (const client of clients) {
        // Check if active (not deleted) task already exists for this client, task_type, and due_date
        const existingSnap = await db.collection('tasks')
          .where('organization_id', '==', orgId)
          .where('client_id', '==', client.id)
          .where('task_type_id', '==', template.task_type_id)
          .where('due_date', '==', due_date)
          .where('deleted_at', '==', null)
          .get();
          
        if (existingSnap.empty) {
          // Spawn task
          const newTaskRef = db.collection('tasks').doc();
          batch.set(newTaskRef, {
            organization_id: orgId,
            client_id: client.id,
            task_type_id: template.task_type_id,
            assigned_user_id: template.assigned_user_id || null,
            created_by: 'system',
            due_date,
            status: 'Assigned',
            tags: template.tags || [],
            created_at: FieldValue.serverTimestamp(),
            deleted_at: null,
            global_template_id: template.id
          });
          writeCount++;
          
          if (writeCount >= 400) {
            await batch.commit();
            batch = db.batch();
            writeCount = 0;
          }
        }
      }
    }
    
    if (writeCount > 0) {
      await batch.commit();
    }
    
    if (!force) {
      await db.collection('system_runs').doc(`${orgId}_${todayStr}`).set({ run_at: FieldValue.serverTimestamp() });
    }
  } catch (error) {
    console.error('Error generating tasks from templates:', error);
  }
}

module.exports = {
  generateTasksFromTemplates
};
