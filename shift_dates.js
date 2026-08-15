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

async function run() {
  try {
    console.log('Connecting to Firebase Firestore...');
    const snapshot = await db.collection('tasks').get();
    console.log(`Found ${snapshot.docs.length} tasks in Firestore.`);

    if (snapshot.empty) {
      console.log('No tasks found in Firestore.');
      process.exit(0);
    }

    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let day;
      const status = data.status || 'Assigned';

      if (status === 'Overdue') {
        day = Math.floor(Math.random() * 14) + 1; // Aug 1 - 14
      } else if (status === 'Assigned' || status === 'In Progress') {
        day = Math.floor(Math.random() * 16) + 15; // Aug 15 - 30
      } else {
        day = Math.floor(Math.random() * 30) + 1; // Aug 1 - 30
      }

      const newDueDate = `2026-08-${day.toString().padStart(2, '0')}`;

      batch.update(doc.ref, { due_date: newDueDate });
      count++;
      totalUpdated++;

      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log(`Successfully updated due_date for all ${totalUpdated} tasks in Firestore to August 2026!`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating tasks in Firestore:', err);
    process.exit(1);
  }
}

run();
