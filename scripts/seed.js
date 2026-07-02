const bcrypt = require('bcrypt');
const { sequelize, Organization, User, Client, TaskType, Task } = require('../models');

async function seed() {
  await sequelize.sync({ force: true }); // Drop & recreate

  // 1. Create Organization
  const org = await Organization.create({ name: 'PodcastOps Global', purchased_seats: 10 });
  const orgId = org.id;

  // 2. Create Users (15)
  const password_hash = await bcrypt.hash('Ashwin123', 10);
  
  const users = await User.bulkCreate([
    { organization_id: orgId, name: 'Ashwin Owner', email: 'ashwin@taskwhite.com', password_hash, role: 'Owner' },
    { organization_id: orgId, name: 'John Smith', email: 'john@taskwhite.com', password_hash, role: 'Admin' },
    { organization_id: orgId, name: 'Sarah Jones', email: 'sarah@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Alex Brown', email: 'alex@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Emma Davis', email: 'emma@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Michael Wilson', email: 'michael@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Olivia Taylor', email: 'olivia@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'James Anderson', email: 'james@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Sophia Thomas', email: 'sophia@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'William Jackson', email: 'william@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Isabella White', email: 'isabella@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Benjamin Harris', email: 'benjamin@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Mia Martin', email: 'mia@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Lucas Thompson', email: 'lucas@taskwhite.com', password_hash, role: 'Member' },
    { organization_id: orgId, name: 'Charlotte Garcia', email: 'charlotte@taskwhite.com', password_hash, role: 'Member' }
  ]);

  // 3. Create Clients (15 Nifty 50)
  const clients = await Client.bulkCreate([
    { organization_id: orgId, name: 'Reliance Industries', email: 'contact@ril.com' },
    { organization_id: orgId, name: 'TCS', email: 'contact@tcs.com' },
    { organization_id: orgId, name: 'Infosys', email: 'contact@infosys.com' },
    { organization_id: orgId, name: 'HDFC Bank', email: 'contact@hdfc.com' },
    { organization_id: orgId, name: 'ICICI Bank', email: 'contact@icici.com' },
    { organization_id: orgId, name: 'SBI', email: 'contact@sbi.com' },
    { organization_id: orgId, name: 'Bharti Airtel', email: 'contact@airtel.com' },
    { organization_id: orgId, name: 'ITC', email: 'contact@itc.com' },
    { organization_id: orgId, name: 'Larsen & Toubro', email: 'contact@lt.com' },
    { organization_id: orgId, name: 'Tata Motors', email: 'contact@tatamotors.com' },
    { organization_id: orgId, name: 'Tata Steel', email: 'contact@tatasteel.com' },
    { organization_id: orgId, name: 'Asian Paints', email: 'contact@asianpaints.com' },
    { organization_id: orgId, name: 'Bajaj Finance', email: 'contact@bajaj.com' },
    { organization_id: orgId, name: 'Nestlé India', email: 'contact@nestle.com' },
    { organization_id: orgId, name: 'Sun Pharma', email: 'contact@sunpharma.com' }
  ]);

  // 4. Create Task Types (20)
  const taskTypes = await TaskType.bulkCreate([
    { organization_id: orgId, name: 'Topic Research' },
    { organization_id: orgId, name: 'Competitor Podcast Analysis' },
    { organization_id: orgId, name: 'Audience Research' },
    { organization_id: orgId, name: 'Guest Research' },
    { organization_id: orgId, name: 'Guest Outreach' },
    { organization_id: orgId, name: 'Guest Confirmation' },
    { organization_id: orgId, name: 'Recording Schedule Setup' },
    { organization_id: orgId, name: 'Interview Question Preparation' },
    { organization_id: orgId, name: 'Episode Outline Creation' },
    { organization_id: orgId, name: 'Audio Recording' },
    { organization_id: orgId, name: 'Video Recording' },
    { organization_id: orgId, name: 'Backup Recording Verification' },
    { organization_id: orgId, name: 'Audio Editing' },
    { organization_id: orgId, name: 'Video Editing' },
    { organization_id: orgId, name: 'Noise Reduction & Cleanup' },
    { organization_id: orgId, name: 'Thumbnail Design' },
    { organization_id: orgId, name: 'Show Notes Writing' },
    { organization_id: orgId, name: 'Transcript Review' },
    { organization_id: orgId, name: 'Episode Upload & Publishing' },
    { organization_id: orgId, name: 'Social Media Asset Creation' }
  ]);

  // 5. Create Tasks (100+)
  const shows = ['Growth Weekly', 'Startup Stories', 'AI Insider', 'Tech Trends', 'Finance Daily'];
  const statuses = ['Assigned', 'In Progress', 'Completed', 'Overdue'];
  const priorities = ['Normal', 'High'];

  const tasks = [];
  for (let i = 1; i <= 120; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const show = shows[Math.floor(Math.random() * shows.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Random date within last 30 days or next 30 days, shifted forward 30 days to look current
    const date = new Date();
    date.setDate(date.getDate() + 30 + (Math.floor(Math.random() * 60) - 30));

    tasks.push({
      organization_id: orgId,
      client_id: client.id,
      task_type_id: taskType.id,
      assigned_user_id: user.id,
      created_by: users[Math.floor(Math.random() * users.length)].id,
      show_name: show,
      episode_name: `Episode ${Math.floor(Math.random() * 100) + 1}`,
      due_date: date.toISOString().split('T')[0],
      priority: priority,
      status: status
    });
  }

  await Task.bulkCreate(tasks);

  console.log('Seed completed successfully! Login with ashwin@taskwhite.com / Ashwin123');
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
