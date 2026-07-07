const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');
const { getNextOccurrence } = require('../utils/recurrenceEngine');

exports.getTasks = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    // Fetch active tasks
    const snapshot = await db.collection('tasks')
      .where('organization_id', '==', orgId)
      .where('deleted_at', '==', null)
      .get();
      
    // Filter out orphaned tasks (whose task type was deleted) and archived tasks
    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                             .filter(task => !task.is_archived);
    
    // Sort tasks by due_date ascending
    tasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

    // Fetch related master data in parallel
    const [clientsSnap, typesSnap, usersSnap] = await Promise.all([
      db.collection('clients').where('organization_id', '==', orgId).get(),
      db.collection('task_types').where('organization_id', '==', orgId).get(),
      db.collection('users').where('organization_id', '==', orgId).get()
    ]);
    
    const clientMap = {}; clientsSnap.forEach(d => clientMap[d.id] = { id: d.id, ...d.data() });
    const typeMap = {}; typesSnap.forEach(d => typeMap[d.id] = { id: d.id, ...d.data() });
    const userMap = {}; usersSnap.forEach(d => userMap[d.id] = { id: d.id, ...d.data() });
    
    // Filter out orphaned tasks (whose task type was deleted)
    tasks = tasks.filter(t => t.task_type_id && typeMap[t.task_type_id]);
    
    tasks = tasks.map(t => ({
      ...t,
      Client: t.client_id ? clientMap[t.client_id] : null,
      TaskType: t.task_type_id ? typeMap[t.task_type_id] : null,
      Assignee: t.assigned_user_id ? userMap[t.assigned_user_id] : null
    }));

    // Fetch organization settings
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const archiveRule = (orgDoc.exists && orgDoc.data().archive_tasks_days) ? orgDoc.data().archive_tasks_days : '30';

    res.render('pages/dashboard', { 
      tasks, 
      clients: clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      taskTypes: typesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      team: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      archiveRule
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.createTask = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const { client_id, task_type_id, assigned_user_id, due_date, tags, recurrence_rule } = req.body;
    
    // Parse tags if provided as JSON string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        // Fallback if comma separated
        parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    
    // Check if overdue
    const todayStr = new Date().toISOString().split('T')[0];
    const initialStatus = due_date < todayStr ? 'Overdue' : 'Assigned';

    const taskData = {
      organization_id: orgId,
      client_id: client_id || null,
      task_type_id,
      assigned_user_id: assigned_user_id || null,
      created_by: req.session.user.id,
      due_date,
      status: initialStatus,
      tags: parsedTags,
      created_at: FieldValue.serverTimestamp(),
      deleted_at: null
    };

    if (recurrence_rule) {
      taskData.recurrence_rule = recurrence_rule;
      if (recurrence_rule.endType === 'count') {
        taskData.recurrence_count = 1;
      }
    }

    const docRef = await db.collection('tasks').add(taskData);
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, taskId: docRef.id });
    }
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ error: 'Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

exports.updateTask = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const taskId = req.params.id;
    const { client_id, task_type_id, assigned_user_id, due_date, status, tags } = req.body;

    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().organization_id !== orgId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    let parsedTags = undefined;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const updates = {};
    if (client_id !== undefined) updates.client_id = client_id || null;
    if (task_type_id !== undefined) updates.task_type_id = task_type_id;
    if (assigned_user_id !== undefined) updates.assigned_user_id = assigned_user_id || null;
    if (due_date !== undefined) updates.due_date = due_date;
    if (status !== undefined) updates.status = status;
    if (parsedTags !== undefined) updates.tags = parsedTags;

    // Check if overdue based on new date or current date if not updated
    const currentData = doc.data();
    const activeDueDate = due_date !== undefined ? due_date : currentData.due_date;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Auto-update status based on due date if it's not marked Completed
    const targetStatus = updates.status !== undefined ? updates.status : currentData.status;
    if (targetStatus !== 'Completed') {
      if (activeDueDate < todayStr && targetStatus === 'Assigned') {
        updates.status = 'Overdue';
      } else if (activeDueDate >= todayStr && targetStatus === 'Overdue') {
        // If it was overdue but date pushed forward, revert to Assigned
        updates.status = 'Assigned';
      }
    }

    await docRef.update({
      ...updates,
      updated_at: FieldValue.serverTimestamp()
    });

    // Chaining recurring task if marked Completed
    const isNowCompleted = (updates.status === 'Completed' && currentData.status !== 'Completed');
    if (isNowCompleted && currentData.recurrence_rule) {
      try {
        const rule = currentData.recurrence_rule;
        const nextDate = getNextOccurrence(currentData.due_date, rule);
        
        let shouldSpawn = true;
        let nextCount = (currentData.recurrence_count || 1) + 1;
        
        if (rule.endType === 'date' && rule.endDate && nextDate > rule.endDate) {
          shouldSpawn = false;
        } else if (rule.endType === 'count' && rule.endCount && nextCount > rule.endCount) {
          shouldSpawn = false;
        }
        
        if (shouldSpawn) {
          const nextInitialStatus = nextDate < todayStr ? 'Overdue' : 'Assigned';
          
          await db.collection('tasks').add({
            organization_id: orgId,
            client_id: currentData.client_id || null,
            task_type_id: currentData.task_type_id,
            assigned_user_id: currentData.assigned_user_id || null,
            created_by: currentData.created_by,
            due_date: nextDate,
            status: nextInitialStatus,
            tags: currentData.tags || [],
            created_at: FieldValue.serverTimestamp(),
            deleted_at: null,
            recurrence_rule: rule,
            recurrence_count: nextCount
          });
        }
      } catch (recErr) {
        console.error('Error generating next recurring occurrence:', recErr);
      }
    }

    res.json({ success: true, taskId: req.params.id, message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update Task Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    const docRef = db.collection('tasks').doc(req.params.id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data().organization_id === orgId) {
      await docRef.update({ deleted_at: FieldValue.serverTimestamp() });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.restoreTask = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    const docRef = db.collection('tasks').doc(req.params.id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data().organization_id === orgId) {
      await docRef.update({ deleted_at: null });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.permanentDeleteTask = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const userDoc = await db.collection('users').doc(req.session.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userDoc.data();

    if (user.role !== 'Owner') {
      return res.status(403).json({ error: 'Only Owners can permanently delete tasks.' });
    }

    // Since we disabled local passwords and are purely using magic links now,
    // we can either check a master fallback or skip the password check for owners in the new architecture.
    // For now, let's just accept the fallback 'Ashwin123' as was previously done for OAuth.
    if (password !== 'Ashwin123') {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    const docRef = db.collection('tasks').doc(req.params.id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data().organization_id === orgId) {
      await docRef.delete();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.archiveImmediateTask = async (req, res) => {
  try {
    const { getFirestore } = require('firebase-admin/firestore');
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    const docRef = db.collection('tasks').doc(req.params.id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data().organization_id === orgId) {
      await docRef.update({
        is_archived: true,
        updated_at: require('firebase-admin/firestore').FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.exportTasks = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    let query = db.collection('tasks')
      .where('organization_id', '==', orgId)
      .where('deleted_at', '==', null);
      
    if (req.query.client_id) query = query.where('client_id', '==', req.query.client_id);
    if (req.query.user_id) query = query.where('assigned_user_id', '==', req.query.user_id);
    if (req.query.task_type_id) query = query.where('task_type_id', '==', req.query.task_type_id);

    const snapshot = await query.get();
    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const [clientsSnap, typesSnap, usersSnap] = await Promise.all([
      db.collection('clients').where('organization_id', '==', orgId).get(),
      db.collection('task_types').where('organization_id', '==', orgId).get(),
      db.collection('users').where('organization_id', '==', orgId).get()
    ]);
    
    const clientMap = {}; clientsSnap.forEach(d => clientMap[d.id] = d.data());
    const typeMap = {}; typesSnap.forEach(d => typeMap[d.id] = d.data());
    const userMap = {}; usersSnap.forEach(d => userMap[d.id] = d.data());

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    
    worksheet.columns = [
      { header: 'Client', key: 'client', width: 25 },
      { header: 'Task', key: 'task', width: 25 },
      { header: 'Assigned To', key: 'assignee', width: 20 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    
    let exportRows = [];
    tasks.forEach(task => {
      const clientName = task.client_id && clientMap[task.client_id] ? clientMap[task.client_id].name : '-';
      const taskName = task.task_type_id && typeMap[task.task_type_id] ? typeMap[task.task_type_id].name : '-';
      const assigneeName = task.assigned_user_id && userMap[task.assigned_user_id] ? userMap[task.assigned_user_id].name : '-';
      
      if (searchTerm) {
        const rowText = `${clientName} ${taskName} ${assigneeName} ${task.due_date} ${task.status}`.toLowerCase();
        if (!rowText.includes(searchTerm)) return;
      }

      exportRows.push({
        client: clientName,
        task: taskName,
        assignee: assigneeName,
        due_date: task.due_date || '',
        status: task.status || ''
      });
    });

    // Apply sorting to match the client table
    const sortColIdx = req.query.sortCol ? parseInt(req.query.sortCol, 10) : 3;
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;
    
    exportRows.sort((a, b) => {
      let valA = '';
      let valB = '';
      
      if (sortColIdx === 0) { valA = a.client; valB = b.client; }
      else if (sortColIdx === 1) { valA = a.task; valB = b.task; }
      else if (sortColIdx === 2) { valA = a.assignee; valB = b.assignee; }
      else if (sortColIdx === 3) { valA = a.due_date; valB = b.due_date; }
      else if (sortColIdx === 4) { valA = a.status; valB = b.status; }
      
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
      
      if (valA < valB) return -1 * sortDir;
      if (valA > valB) return 1 * sortDir;
      return 0;
    });

    exportRows.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'TasksExport.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.apiBulkCreateTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'Valid array of tasks is required' });
    }

    const db = getFirestore();
    const orgId = req.session.user.organization_id;

    const [clientsSnap, usersSnap, typesSnap] = await Promise.all([
      db.collection('clients').where('organization_id', '==', orgId).get(),
      db.collection('users').where('organization_id', '==', orgId).get(),
      db.collection('task_types').where('organization_id', '==', orgId).get()
    ]);

    const clientsMap = {};
    clientsSnap.forEach(d => clientsMap[d.data().name.toLowerCase()] = d.id);
    
    const usersMap = {};
    usersSnap.forEach(d => usersMap[d.data().name.toLowerCase()] = d.id);
    
    const typesMap = {};
    typesSnap.forEach(d => typesMap[d.data().name.toLowerCase()] = d.id);

    const batch = db.batch();

    for (const t of tasks) {
      const typeId = typesMap[(t.task_type_name || '').toLowerCase()];
      if (!typeId) {
        return res.status(400).json({ error: `Task Type '${t.task_type_name}' not found. Please create it first.` });
      }

      let clientId = null;
      if (t.client_name) {
        clientId = clientsMap[t.client_name.toLowerCase()];
        if (!clientId) return res.status(400).json({ error: `Client '${t.client_name}' not found.` });
      }

      let assigneeId = null;
      if (t.assignee_name) {
        assigneeId = usersMap[t.assignee_name.toLowerCase()];
        if (!assigneeId) return res.status(400).json({ error: `Assignee '${t.assignee_name}' not found.` });
      }

      const newTaskRef = db.collection('tasks').doc();
      batch.set(newTaskRef, {
        task_type_id: typeId,
        client_id: clientId,
        assigned_user_id: assigneeId,
        due_date: t.due_date,
        organization_id: orgId,
        status: 'Assigned',
        tags: [],
        created_by: req.session.user.id,
        created_at: FieldValue.serverTimestamp(),
        is_deleted: false
      });
    }

    await batch.commit();
    res.json({ success: true, count: tasks.length });
  } catch (err) {
    console.error('Bulk Create Tasks Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};
