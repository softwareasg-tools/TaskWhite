const express = require('express');
const router = express.Router();
const { requireAuth } = require('./authRoutes');
const masterDataController = require('../controllers/masterDataController');
const aiController = require('../controllers/aiController');

router.get('/clients', requireAuth, masterDataController.getClients);
router.get('/team', requireAuth, masterDataController.getTeam);
router.get('/task-types', requireAuth, masterDataController.getTaskTypes);
router.get('/recycle-bin', requireAuth, masterDataController.getRecycleBin);
router.get('/settings', requireAuth, masterDataController.getSettings);
router.post('/settings/profile', requireAuth, masterDataController.updateProfile);

router.post('/api/clients', requireAuth, express.json(), masterDataController.apiCreateClient);
router.post('/api/clients/bulk', requireAuth, express.json(), masterDataController.apiBulkCreateClients);
router.post('/api/task-types', requireAuth, express.json(), masterDataController.apiCreateTaskType);
router.post('/api/task-types/bulk', requireAuth, express.json(), masterDataController.apiBulkCreateTaskTypes);
router.post('/api/team', requireAuth, express.json(), masterDataController.apiCreateUser);
router.post('/api/team/bulk', requireAuth, express.json(), masterDataController.apiBulkCreateUsers);
router.post('/api/ai/generate-tasks', requireAuth, express.json(), aiController.generateTaskTypes);

router.delete('/clients/:id', requireAuth, masterDataController.deleteClient);
router.delete('/task-types/:id', requireAuth, masterDataController.deleteTaskType);
router.delete('/team/:id', requireAuth, masterDataController.deleteUser);

module.exports = router;
