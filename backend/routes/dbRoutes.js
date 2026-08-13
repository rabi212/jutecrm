const express = require('express');
const router = express.Router();
const dbController = require('../controllers/dbController');

router.get('/db', dbController.getDbState);
router.get('/db/:table', dbController.getTableData);
router.post('/db/save', dbController.saveDbState);

module.exports = router;
