const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Middleware to check auth
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const passport = require('passport');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

// Magic URL / Auth Routing
router.get('/auth/verify', authController.getAuthVerify);
router.post('/api/auth/post-login-routing', express.json(), authLimiter, authController.postLoginRouting);
router.post('/api/auth/magic-link', express.json(), authLimiter, authController.sendMagicLink);

// OAuth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  req.session.user = { id: req.user.id, name: req.user.name, role: req.user.role, organization_id: req.user.organization_id };
  res.redirect('/dashboard');
});

router.get('/auth/microsoft', passport.authenticate('microsoft', { prompt: 'select_account' }));
router.get('/auth/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/login' }), (req, res) => {
  req.session.user = { id: req.user.id, name: req.user.name, role: req.user.role, organization_id: req.user.organization_id };
  res.redirect('/dashboard');
});

module.exports = { router, requireAuth };
