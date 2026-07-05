const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { generateTasksFromTemplates } = require('../utils/templateManager');

exports.getClients = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('clients').where('organization_id', '==', req.session.user.organization_id).get();
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('pages/clients', { clients });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.getTeam = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('users').where('organization_id', '==', req.session.user.organization_id).get();
    const team = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('pages/team', { team });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.getTaskTypes = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('task_types').where('organization_id', '==', req.session.user.organization_id).get();
    const taskTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('pages/task-types', { taskTypes });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.getRecycleBin = async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    // Fetch deleted tasks by getting all tasks for org and filtering in memory to avoid composite index requirements
    const snapshot = await db.collection('tasks')
      .where('organization_id', '==', orgId)
      .get();
      
    let tasks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(task => task.deleted_at !== null && task.deleted_at !== undefined);
    
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

    res.render('pages/recycle-bin', { tasks });
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error loading recycle bin: ${err.message}`);
  }
};

exports.getSettings = async (req, res) => {
  try {
    const db = getFirestore();
    const orgDoc = await db.collection('organizations').doc(req.session.user.organization_id).get();
    const org = { id: orgDoc.id, ...orgDoc.data() };
    
    const usersSnap = await db.collection('users').where('organization_id', '==', org.id).get();
    const usedSeats = usersSnap.size;
    
    res.render('pages/settings', { org, usedSeats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const db = getFirestore();
    const userId = req.session.user.id;

    await db.collection('users').doc(userId).update({ name });
    req.session.user.name = name;

    res.json({ success: true, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// API Endpoints for inline creation
exports.apiCreateClient = async (req, res) => {
  try {
    const { name, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const db = getFirestore();
    const newDoc = {
      name,
      notes: notes || null,
      organization_id: req.session.user.organization_id,
      created_at: FieldValue.serverTimestamp()
    };
    
    const ref = await db.collection('clients').add(newDoc);
    
    // Auto-generate template tasks for the new client
    await generateTasksFromTemplates(db, req.session.user.organization_id, true);
    
    res.json({ id: ref.id, ...newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.apiBulkCreateClients = async (req, res) => {
  try {
    const { names } = req.body;
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Valid array of names is required' });
    }
    
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const batch = db.batch();
    
    names.forEach(name => {
      const newRef = db.collection('clients').doc();
      batch.set(newRef, {
        name: name,
        notes: null,
        organization_id: orgId,
        created_at: FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    // Auto-generate template tasks for the new clients
    await generateTasksFromTemplates(db, orgId, true);
    
    res.json({ success: true, count: names.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.apiCreateTaskType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const db = getFirestore();
    const newDoc = {
      name,
      organization_id: req.session.user.organization_id,
      created_at: FieldValue.serverTimestamp()
    };
    
    const ref = await db.collection('task_types').add(newDoc);
    res.json({ id: ref.id, ...newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.apiBulkCreateTaskTypes = async (req, res) => {
  try {
    const { names, aiIndustry } = req.body;
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Valid array of names is required' });
    }
    
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    const batch = db.batch();
    
    names.forEach(name => {
      const newRef = db.collection('task_types').doc();
      batch.set(newRef, {
        name: name,
        organization_id: orgId,
        created_at: FieldValue.serverTimestamp()
      });
    });

    if (aiIndustry) {
      batch.update(db.collection('organizations').doc(orgId), { last_ai_industry: aiIndustry });
    }
    
    await batch.commit();
    res.json({ success: true, count: names.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.apiCreateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required.' });
    }
    
    const db = getFirestore();
    
    // Check if user already exists in this org
    const existingSnap = await db.collection('users')
      .where('email', '==', email)
      .where('organization_id', '==', req.session.user.organization_id)
      .limit(1).get();
      
    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'User is already in this workspace.' });
    }

    const newDoc = {
      name,
      email,
      role: role || 'Member',
      organization_id: req.session.user.organization_id,
      status: 'Active',
      created_at: FieldValue.serverTimestamp()
    };
    
    // Create new doc in users
    const ref = await db.collection('users').add(newDoc);
    const newUser = { id: ref.id, ...newDoc };

    // Send an invite email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || 'test@example.com',
        to: email,
        subject: 'You have been invited to TaskWhite',
        html: `Hello ${name},<br><br>You have been invited to join the team. You can login using your Magic Link at the login page using this email address.<br><br>Welcome!`
      });
    } catch (mailErr) {
      console.error('Failed to send invite email:', mailErr);
    }

    res.json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.apiBulkCreateUsers = async (req, res) => {
  try {
    const { members, role } = req.body;
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Valid array of members is required.' });
    }
    
    const db = getFirestore();
    const orgId = req.session.user.organization_id;
    
    // Fetch all existing users in org to check for duplicates
    const existingSnap = await db.collection('users')
      .where('organization_id', '==', orgId)
      .get();
    const existingEmails = new Set(existingSnap.docs.map(doc => doc.data().email));
    
    const batch = db.batch();
    const newMembers = [];
    
    members.forEach(member => {
      if (!existingEmails.has(member.email)) {
        const newRef = db.collection('users').doc();
        const docData = {
          name: member.name,
          email: member.email,
          role: role || 'Member',
          organization_id: orgId,
          status: 'Active',
          created_at: FieldValue.serverTimestamp()
        };
        batch.set(newRef, docData);
        newMembers.push(docData);
      }
    });
    
    await batch.commit();

    // Send emails asynchronously
    if (newMembers.length > 0) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'test@example.com',
          pass: process.env.SMTP_PASS || 'password'
        }
      });

      Promise.all(newMembers.map(async (m) => {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER || 'test@example.com',
            to: m.email,
            subject: 'You have been invited to TaskWhite',
            html: `Hello ${m.name},<br><br>You have been invited to join the team. You can login using your Magic Link at the login page using this email address.<br><br>Welcome!`
          });
        } catch (mailErr) {
          console.error(`Failed to send invite email to ${m.email}:`, mailErr);
        }
      })).catch(console.error);
    }
    
    res.json({ success: true, count: newMembers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const db = getFirestore();
    const tasksSnap = await db.collection('tasks')
      .where('client_id', '==', req.params.id)
      .where('deleted_at', '==', null)
      .get();
      
    const activeTasks = tasksSnap.docs.filter(doc => doc.data().status !== 'Completed');

    if (activeTasks.length > 0) {
      return res.status(400).json({ error: `Cannot delete client. They are linked to ${activeTasks.length} active (incomplete) task(s).` });
    }
    
    await db.collection('clients').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteTaskType = async (req, res) => {
  try {
    const db = getFirestore();
    const tasksSnap = await db.collection('tasks')
      .where('task_type_id', '==', req.params.id)
      .where('deleted_at', '==', null)
      .get();
      
    const activeTasks = tasksSnap.docs.filter(doc => doc.data().status !== 'Completed');

    if (activeTasks.length > 0) {
      return res.status(400).json({ error: `Cannot delete task. It is used in ${activeTasks.length} active (incomplete) dashboard task(s).` });
    }
    
    await db.collection('task_types').doc(req.params.id).delete();
    
    // Cascade delete any global task templates for this task type
    const templatesSnap = await db.collection('global_task_templates')
      .where('task_type_id', '==', req.params.id)
      .get();
      
    if (!templatesSnap.empty) {
      const batch = db.batch();
      templatesSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (userDoc.exists && userDoc.data().role === 'Owner') {
      return res.status(400).json({ error: 'Cannot delete the organization Owner.' });
    }

    const tasksSnap = await db.collection('tasks')
      .where('assigned_user_id', '==', req.params.id)
      .where('deleted_at', '==', null)
      .get();
      
    const activeTasks = tasksSnap.docs.filter(doc => doc.data().status !== 'Completed');

    if (activeTasks.length > 0) {
      return res.status(400).json({ error: `Cannot delete user. They are assigned to ${activeTasks.length} active (incomplete) task(s).` });
    }
    
    await db.collection('users').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};
