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
    
    // 3. Determine target periods (Current Month and Next Month)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    const targetMonths = [
      { year: currentYear, month: currentMonth }, // This month
      { year: currentMonth === 11 ? currentYear + 1 : currentYear, month: (currentMonth + 1) % 12 } // Next month
    ];
    
    let batch = db.batch();
    let writeCount = 0;
    
    for (const template of templates) {
      const rule = template.recurrence_rule;
      if (!rule || rule.frequency !== 'monthly') continue; 
      
      const targetDay = parseInt(rule.monthlyDay || 20, 10);
      
      for (const tMonth of targetMonths) {
        // Calculate due date for this target month
        const lastDayOfTargetMonth = new Date(tMonth.year, tMonth.month + 1, 0).getDate();
        const actualDay = Math.min(targetDay, lastDayOfTargetMonth);
        const due_date = `${tMonth.year}-${String(tMonth.month + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
        
        // Skip if this due date is in the past
        if (due_date < todayStr) {
          continue;
        }
        
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
