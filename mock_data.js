require('dotenv').config();
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  let serviceAccount = {};
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch(e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

const nifty50 = [
  "Reliance Industries", "TCS", "HDFC Bank", "ICICI Bank", "Infosys",
  "Hindustan Unilever", "ITC", "SBI", "Bharti Airtel", "Kotak Mahindra Bank",
  "Larsen & Toubro", "Axis Bank", "Bajaj Finance", "Asian Paints", "Maruti Suzuki",
  "HCL Technologies", "Tata Motors", "Sun Pharma", "Titan Company", "UltraTech Cement"
];

const podcastTasks = [
  "Pre-production Planning", "Guest Research", "Scriptwriting", "Storyboarding",
  "Equipment Setup", "Microphone Testing", "Lighting Configuration", "Camera Positioning",
  "Audio Recording", "Video Recording", "B-roll Footage Capture", "Audio Syncing",
  "Noise Reduction", "Audio Equalization", "Video Editing - Rough Cut", "Video Editing - Final Cut",
  "Color Grading", "Adding Lower Thirds", "Intro/Outro Creation", "Background Music Selection",
  "Audio Mixing", "Podcast Cover Art Design", "Show Notes Writing", "Transcript Generation",
  "SEO Optimization for Title", "Thumbnail Design", "Uploading to Audio Hosts (Spotify/Apple)",
  "Uploading to YouTube", "Social Media Teaser Creation", "Analytics Review"
];

const teamNames = [
  "Ravi Kumar", "Priya Sharma", "Amit Patel", "Neha Gupta", "Vikram Singh",
  "Anjali Desai", "Suresh Reddy", "Kavita Verma", "Rahul Menon", "Sneha Iyer",
  "John Smith", "Emily Johnson", "Michael Williams", "Sarah Brown", "David Jones",
  "Jessica Garcia", "James Miller", "Ashley Davis", "Robert Rodriguez", "Amanda Martinez"
];

const statuses = ['Assigned', 'In Progress', 'Completed', 'Overdue'];

async function run() {
  try {
    const email = 'asg.ashwin@gmail.com';
    const userSnap = await db.collection('users').where('email', '==', email).get();
    
    if (userSnap.empty) {
      console.error(`User ${email} not found.`);
      process.exit(1);
    }
    
    const userDoc = userSnap.docs[0];
    const orgId = userDoc.data().organization_id;
    console.log(`Found user ${email} with orgId: ${orgId}`);

    // Create Clients
    console.log("Creating 20 Nifty 50 Clients...");
    const clientRefs = [];
    for (const name of nifty50) {
      const ref = await db.collection('clients').add({
        name,
        organization_id: orgId,
        created_at: FieldValue.serverTimestamp()
      });
      clientRefs.push(ref.id);
    }

    // Create Task Types
    console.log("Creating 30 Podcast Task Types...");
    const taskTypeRefs = [];
    for (const name of podcastTasks) {
      const ref = await db.collection('task_types').add({
        name,
        organization_id: orgId,
        created_at: FieldValue.serverTimestamp()
      });
      taskTypeRefs.push(ref.id);
    }

    // Create Users
    console.log("Creating 20 Team Members...");
    const userRefs = [];
    for (const name of teamNames) {
      const ref = await db.collection('users').add({
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
        role: 'Member',
        organization_id: orgId,
        status: 'Active',
        created_at: FieldValue.serverTimestamp()
      });
      userRefs.push(ref.id);
    }

    // Create 100 Tasks
    console.log("Creating 100 Tasks...");
    for (let i = 0; i < 100; i++) {
      const randomClient = clientRefs[Math.floor(Math.random() * clientRefs.length)];
      const randomTaskType = taskTypeRefs[Math.floor(Math.random() * taskTypeRefs.length)];
      const randomUser = userRefs[Math.floor(Math.random() * userRefs.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random due date between -30 days and +30 days
      const daysOffset = Math.floor(Math.random() * 61) - 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await db.collection('tasks').add({
        organization_id: orgId,
        client_id: randomClient,
        task_type_id: randomTaskType,
        assigned_user_id: randomUser,
        status: randomStatus,
        due_date: dueDateStr,
        created_by: userDoc.id,
        created_at: FieldValue.serverTimestamp(),
        deleted_at: null,
        tags: ['podcast', 'mock-data']
      });
    }

    console.log("Successfully generated all mock data.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
