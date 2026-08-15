require('dotenv').config();
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  let serviceAccount = {};
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch(e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    process.exit(1);
  }
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function cleanupGSTReturn() {
  try {
    console.log('Searching for "GST Return" task types...');
    const typesSnap = await db.collection('task_types').get();
    const gstTypeIds = [];
    typesSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('gst return')) {
        gstTypeIds.push(doc.id);
        console.log(`Found GST Return Task Type ID: ${doc.id}`);
      }
    });

    console.log('Searching for active tasks linked to GST Return...');
    const tasksSnap = await db.collection('tasks').get();
    let deletedTaskCount = 0;
    const batch = db.batch();

    tasksSnap.docs.forEach(doc => {
      const data = doc.data();
      const matchesTypeId = gstTypeIds.includes(data.task_type_id);
      const matchesTitle = data.title && data.title.toLowerCase().includes('gst return');
      
      if (matchesTypeId || matchesTitle) {
        batch.delete(doc.ref);
        deletedTaskCount++;
      }
    });

    console.log(`Deleting ${deletedTaskCount} GST Return tasks...`);

    // Clean up Global Templates for GST Return
    let deletedTemplateCount = 0;
    const templatesSnap = await db.collection('global_templates').get();
    templatesSnap.docs.forEach(doc => {
      const data = doc.data();
      if (gstTypeIds.includes(data.task_type_id)) {
        batch.delete(doc.ref);
        deletedTemplateCount++;
      }
    });

    // Delete the task type itself
    for (const typeId of gstTypeIds) {
      batch.delete(db.collection('task_types').doc(typeId));
    }

    await batch.commit();
    console.log(`SUCCESS! Removed ${deletedTaskCount} tasks, ${deletedTemplateCount} global templates, and ${gstTypeIds.length} task type(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning up GST Return tasks:', err);
    process.exit(1);
  }
}

cleanupGSTReturn();
