const { getFirestore } = require('firebase-admin/firestore');

exports.getDashboard = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const userId = req.session.user.id;

    // Auto-generate template tasks if not already run today
    const { generateTasksFromTemplates } = require('../utils/templateManager');
    await generateTasksFromTemplates(db, orgId);

    // Fetch active tasks for this organization
    const snapshot = await db.collection('tasks')
      .where('organization_id', '==', orgId)
      .where('deleted_at', '==', null)
      .get();
      
    let allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // My View Toggle Logic
    if (req.query.view === 'my') {
      allTasks = allTasks.filter(t => t.assigned_user_id === userId || t.created_by === userId);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const batch = db.batch();
    let hasUpdates = false;

    // Automatic Status Update for Overdue Tasks
    allTasks.forEach(task => {
      let changed = false;
      if (['Assigned', 'In Progress'].includes(task.status) && task.due_date && task.due_date < todayStr) {
        task.status = 'Overdue';
        changed = true;
      } else if (task.status === 'Overdue' && task.due_date && task.due_date >= todayStr) {
        task.status = 'Assigned'; // Revert if due date was extended
        changed = true;
      }
      
      if (changed) {
        hasUpdates = true;
        batch.update(db.collection('tasks').doc(task.id), { status: task.status });
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }

    // Apply Filters
    let filteredTasks = [...allTasks];
    
    // Time Period Filter
    if (req.query.time) {
      const timeFilter = req.query.time;
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      filteredTasks = filteredTasks.filter(t => {
        if (!t.due_date) return false;
        
        const taskDate = new Date(t.due_date);
        taskDate.setHours(0, 0, 0, 0);
        
        if (timeFilter === 'today') {
          return taskDate.getTime() === todayDate.getTime();
        } else if (timeFilter === 'custom') {
          let matches = true;
          if (req.query.start_date) {
            const start = new Date(req.query.start_date);
            start.setHours(0, 0, 0, 0);
            if (taskDate < start) matches = false;
          }
          if (req.query.end_date) {
            const end = new Date(req.query.end_date);
            end.setHours(0, 0, 0, 0);
            if (taskDate > end) matches = false;
          }
          return matches;
        } else {
          // Handle X days
          let days = 0;
          if (timeFilter === '7days') days = 7;
          if (timeFilter === '15days') days = 15;
          if (timeFilter === '30days') days = 30;
          if (timeFilter === '60days') days = 60;
          if (timeFilter === '90days') days = 90;
          
          if (days > 0) {
            const endDate = new Date(todayDate);
            endDate.setDate(todayDate.getDate() + days);
            return taskDate >= todayDate && taskDate <= endDate;
          }
          return true;
        }
      });
    }

    if (req.query.client_id) {
      filteredTasks = filteredTasks.filter(t => t.client_id === req.query.client_id);
    }
    if (req.query.user_id) {
      filteredTasks = filteredTasks.filter(t => t.assigned_user_id === req.query.user_id);
    }
    if (req.query.task_type_id) {
      filteredTasks = filteredTasks.filter(t => t.task_type_id === req.query.task_type_id);
    }
    if (req.query.tag) {
      filteredTasks = filteredTasks.filter(t => t.tags && t.tags.includes(req.query.tag));
    }
    if (req.query.status) {
      filteredTasks = filteredTasks.filter(t => t.status === req.query.status);
    }

    // Extract all unique tags for the filter dropdown (from all org tasks, not just filtered ones)
    const uniqueTags = new Set();
    allTasks.forEach(t => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    const availableTags = Array.from(uniqueTags).sort();

    // KPI Cards
    const totalTasks = filteredTasks.length;
    const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const overdue = filteredTasks.filter(t => t.status === 'Overdue').length;
    const assigned = filteredTasks.filter(t => t.status === 'Assigned').length;
    const statusData = [assigned, inProgress, completed, overdue];

    // Fetch related master data in parallel
    const [clientsSnap, typesSnap, usersSnap] = await Promise.all([
      db.collection('clients').where('organization_id', '==', orgId).get(),
      db.collection('task_types').where('organization_id', '==', orgId).get(),
      db.collection('users').where('organization_id', '==', orgId).get()
    ]);
    
    const clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const taskTypes = typesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const clientMap = {}; clients.forEach(d => clientMap[d.id] = d);
    const typeMap = {}; taskTypes.forEach(d => typeMap[d.id] = d);
    const userMap = {}; users.forEach(d => userMap[d.id] = d);

    // Filter out orphaned tasks (whose task type was deleted)
    filteredTasks = filteredTasks.filter(t => t.task_type_id && typeMap[t.task_type_id]);

    // Chart Data - Tasks by Team Member
    let chartUsers = users;
    if (req.query.user_id) {
      chartUsers = users.filter(u => u.id === req.query.user_id);
    }
    const teamLabels = [];
    const teamData = [];
    for (let user of chartUsers) {
      const count = filteredTasks.filter(t => t.assigned_user_id === user.id).length;
      teamLabels.push(user.name ? user.name.split(' ')[0] : 'Unknown'); // First name
      teamData.push(count);
    }

    // Chart Data - Tasks by Task Type
    let chartTaskTypes = taskTypes;
    if (req.query.task_type_id) {
      chartTaskTypes = taskTypes.filter(t => t.id === req.query.task_type_id);
    }
    const typeLabels = [];
    const typeData = [];
    for(let type of chartTaskTypes) {
      const count = filteredTasks.filter(t => t.task_type_id === type.id).length;
      typeLabels.push(type.name);
      typeData.push(count);
    }

    // Map relations to tasks for the grid
    const mappedTasks = filteredTasks.map(t => ({
      ...t,
      Client: t.client_id ? clientMap[t.client_id] : null,
      TaskType: t.task_type_id ? typeMap[t.task_type_id] : null,
      Assignee: t.assigned_user_id ? userMap[t.assigned_user_id] : null
    }));
    
    // Sort tasks by due date
    mappedTasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

    res.render('pages/dashboard', {
      stats: { totalTasks, assigned, inProgress, completed, overdue },
      tasks: mappedTasks,
      clients,
      users,
      taskTypes,
      availableTags,
      query: req.query,
      chartData: {
        statusLabels: ['Assigned', 'In Progress', 'Completed', 'Overdue'],
        statusData,
        teamLabels,
        teamData,
        typeLabels,
        typeData
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
