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
    console.log('Fetching all task types...');
    const typesSnap = await db.collection('task_types').get();
    const typeMap = {};
    const gstTypeIds = new Set();

    typesSnap.docs.forEach(doc => {
      const data = doc.data();
      typeMap[doc.id] = data;
      if (data.name && data.name.toLowerCase().includes('gst')) {
        gstTypeIds.add(doc.id);
        console.log(`Found GST Task Type: "${data.name}" (ID: ${doc.id})`);
      }
    });

    console.log('Fetching all tasks...');
    const tasksSnap = await db.collection('tasks').get();
    let deletedTaskCount = 0;

    let batch = db.batch();
    let count = 0;

    for (const doc of tasksSnap.docs) {
      const data = doc.data();
      const typeObj = typeMap[data.task_type_id];
      const typeName = typeObj ? typeObj.name.toLowerCase() : '';
      
      const isGST = gstTypeIds.has(data.task_type_id) || 
                    typeName.includes('gst') ||
                    (data.title && data.title.toLowerCase().includes('gst')) ||
                    (data.name && data.name.toLowerCase().includes('gst'));

      if (isGST) {
        batch.delete(doc.ref);
        deletedTaskCount++;
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
    }

    console.log('Fetching all global templates...');
    const templatesSnap = await db.collection('global_templates').get();
    let deletedTemplateCount = 0;

    for (const doc of templatesSnap.docs) {
      const data = doc.data();
      const typeObj = typeMap[data.task_type_id];
      const typeName = typeObj ? typeObj.name.toLowerCase() : '';

      if (gstTypeIds.has(data.task_type_id) || typeName.includes('gst')) {
        batch.delete(doc.ref);
        deletedTemplateCount++;
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
    }

    // Delete matching task types
    for (const typeId of gstTypeIds) {
      batch.delete(db.collection('task_types').doc(typeId));
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log(`SUCCESS! Wiped ${deletedTaskCount} GST tasks, ${deletedTemplateCount} templates, and ${gstTypeIds.size} task types from backend.`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning up GST tasks:', err);
    process.exit(1);
  }
}

cleanupGSTReturn();
