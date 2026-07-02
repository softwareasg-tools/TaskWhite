const express = require('express');
const router = express.Router();
const { requireAuth } = require('./authRoutes');
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard', requireAuth, dashboardController.getDashboard);
router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('pages/landing', { layout: 'layout' });
});

module.exports = router;
