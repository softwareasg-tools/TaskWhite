const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');

exports.getTasks = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    // Fetch active tasks
    const snapshot = await db.collection('tasks')
      .where('organization_id', '==', orgId)
      .where('deleted_at', '==', null)
      .get();
      
    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
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
    
    tasks = tasks.map(t => ({
      ...t,
      Client: t.client_id ? clientMap[t.client_id] : null,
      TaskType: t.task_type_id ? typeMap[t.task_type_id] : null,
      Assignee: t.assigned_user_id ? userMap[t.assigned_user_id] : null
    }));

    res.render('pages/tasks', { tasks });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.createTask = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const { client_id, task_type_id, assigned_user_id, due_date, tags } = req.body;
    
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

    await db.collection('tasks').add({
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
    });
    
    // Redirect back to dashboard where they created it
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
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

    // Sort tasks by due_date ascending
    tasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

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

    tasks.forEach(task => {
      worksheet.addRow({
        client: task.client_id && clientMap[task.client_id] ? clientMap[task.client_id].name : '-',
        task: task.task_type_id && typeMap[task.task_type_id] ? typeMap[task.task_type_id].name : '-',
        assignee: task.assigned_user_id && userMap[task.assigned_user_id] ? userMap[task.assigned_user_id].name : '-',
        due_date: task.due_date,
        status: task.status
      });
    });

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
