const express = require('express');
const router = express.Router();
const { requireAuth } = require('./authRoutes');
const taskController = require('../controllers/taskController');

router.get('/tasks', requireAuth, taskController.getTasks);
router.post('/tasks', requireAuth, taskController.createTask);
router.post('/tasks/bulk', requireAuth, express.json(), taskController.apiBulkCreateTasks);
router.delete('/tasks/:id', requireAuth, taskController.deleteTask);
router.post('/tasks/:id/restore', requireAuth, taskController.restoreTask);
router.post('/tasks/:id/permanent', requireAuth, taskController.permanentDeleteTask);
router.get('/tasks/export', requireAuth, taskController.exportTasks);

module.exports = router;
