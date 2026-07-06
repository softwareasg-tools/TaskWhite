const express = require('express');
const router = express.Router();
const { requireAuth } = require('./authRoutes');
const taskController = require('../controllers/taskController');

router.get('/tasks', requireAuth, taskController.getTasks);
router.post('/tasks', requireAuth, taskController.createTask);
router.post('/tasks/bulk', requireAuth, express.json(), taskController.apiBulkCreateTasks);
router.put('/tasks/:id', requireAuth, express.json(), taskController.updateTask);
router.delete('/tasks/:id', requireAuth, taskController.deleteTask);
router.post('/tasks/:id/restore', requireAuth, taskController.restoreTask);
router.post('/tasks/:id/permanent', requireAuth, taskController.permanentDeleteTask);
router.post('/tasks/:id/archive-immediate', requireAuth, taskController.archiveImmediateTask);
router.get('/tasks/export', requireAuth, taskController.exportTasks);

module.exports = router;
