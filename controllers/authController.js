const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

exports.getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('pages/login', { 
    layout: 'layout', 
    error: null, 
    message: null,
    firebaseConfig: process.env.FIREBASE_CONFIG
  });
};

// Legacy password login
exports.postLogin = async (req, res) => {
  // Disabled
  res.redirect('/login');
};

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin (Only once)
if (getApps().length === 0) {
  let serviceAccount = {};
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch(e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY');
  }

  initializeApp({
    credential: cert(serviceAccount)
  });
}

exports.getAuthVerify = (req, res) => {
  res.render('pages/auth-verify', {
    layout: 'layout',
    user: null,
    firebaseConfig: process.env.FIREBASE_CONFIG
  });
};

exports.sendMagicLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email missing' });

    const actionCodeSettings = {
      url: `${req.protocol}://${req.get('host')}/auth/verify`,
      handleCodeInApp: true
    };

    const link = await getAuth().generateSignInWithEmailLink(email, actionCodeSettings);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 40px 0; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <h1 style="color: #1a202c; font-size: 24px; margin-bottom: 10px;">Sign in to TaskWhite</h1>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 30px;">Click the button below to securely sign in to your workspace. This link will expire in 10 minutes.</p>
          <a href="${link}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 6px; box-shadow: 0 4px 6px rgba(15, 23, 42, 0.2);">Sign In to TaskWhite</a>
          <p style="color: #a0aec0; font-size: 12px; margin-top: 30px;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"TaskWhite" <' + (process.env.SMTP_USER || 'hello@taskwhite.com') + '>',
      to: email,
      subject: 'Sign in to TaskWhite',
      html: htmlContent
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error generating/sending magic link:', err);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
};

exports.postLoginRouting = async (req, res) => {
  try {
    const { email, name, firebaseUserId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email missing' });

    const db = getFirestore();
    
    // Two-Tier Domain Logic
    const domain = email.split('@')[1].toLowerCase();
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    
    let organizationId = null;
    let localUserId = firebaseUserId;
    let userRole = 'Member';

    if (genericDomains.includes(domain)) {
      // 1. Personal Workspace
      // Create Organization
      const orgRef = await db.collection('organizations').add({
        org_name: (name || email.split('@')[0]) + "'s Workspace",
        invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        created_at: FieldValue.serverTimestamp()
      });
      organizationId = orgRef.id;
      userRole = 'Owner';
      
      // Create Member Link
      await db.collection('org_members').add({
        org_id: organizationId,
        user_id: firebaseUserId,
        role: userRole,
        joined_at: FieldValue.serverTimestamp()
      });
      
    } else {
      // 2. Company Domain
      // Check if Org with this domain exists
      const orgsSnapshot = await db.collection('organizations')
        .where('domain_restriction', '==', domain)
        .limit(1)
        .get();
        
      if (!orgsSnapshot.empty) {
        // Auto-join existing org
        const orgDoc = orgsSnapshot.docs[0];
        organizationId = orgDoc.id;
        
        // Ensure not already a member
        const memberSnapshot = await db.collection('org_members')
          .where('org_id', '==', organizationId)
          .where('user_id', '==', firebaseUserId)
          .limit(1)
          .get();
        
        if (memberSnapshot.empty) {
          await db.collection('org_members').add({
            org_id: organizationId,
            user_id: firebaseUserId,
            role: 'Member',
            joined_at: FieldValue.serverTimestamp()
          });
        }
      } else {
        // Create new company org
        const orgRef = await db.collection('organizations').add({
          org_name: domain.split('.')[0].toUpperCase() + ' Workspace',
          invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          domain_restriction: domain,
          created_at: FieldValue.serverTimestamp()
        });
        organizationId = orgRef.id;
        userRole = 'Owner';
        
        await db.collection('org_members').add({
          org_id: organizationId,
          user_id: firebaseUserId,
          role: userRole,
          joined_at: FieldValue.serverTimestamp()
        });
      }
    }

    // Save/Update User in Firestore
    await db.collection('users').doc(firebaseUserId).set({
      name: name || email.split('@')[0],
      email: email,
      role: userRole,
      organization_id: organizationId,
      status: 'Active',
      last_login: FieldValue.serverTimestamp()
    }, { merge: true });

    // Set Express Session to maintain hybrid compatibility
    req.session.user = { 
      id: localUserId, 
      name: name || email.split('@')[0], 
      email: email, 
      role: userRole, 
      organization_id: organizationId 
    };

    res.json({ success: true, redirect: '/dashboard' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error processing workspace' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

exports.getSignup = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('pages/signup', { 
    layout: 'layout', 
    error: null,
    firebaseConfig: process.env.FIREBASE_CONFIG
  });
};

exports.postSignup = async (req, res) => {
  // Legacy signup is disabled. Use Magic Links.
  res.redirect('/login');
};
