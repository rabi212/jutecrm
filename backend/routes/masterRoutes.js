const express = require('express');
const router = express.Router();

const buyerController = require('../controllers/buyerController');
const customerController = require('../controllers/customerController');
const cutterController = require('../controllers/cutterController');
const fabricatorController = require('../controllers/fabricatorController');
const finisherController = require('../controllers/finisherController');
const printerController = require('../controllers/printerController');
const supplierController = require('../controllers/supplierController');
const materialController = require('../controllers/materialController');
const unitController = require('../controllers/unitController');

// Helper to bind CRUD routes dynamically
const bindRoutes = (basePath, controller) => {
  router.get(`/${basePath}`, controller.getAll);
  router.post(`/${basePath}`, controller.create);
  router.put(`/${basePath}/:id`, controller.update);
  router.delete(`/${basePath}/:id`, controller.delete);
};

bindRoutes('buyers', buyerController);
bindRoutes('customers', customerController);
bindRoutes('cutters', cutterController);
bindRoutes('fabricators', fabricatorController);
bindRoutes('finishers', finisherController);
bindRoutes('printers', printerController);
bindRoutes('suppliers', supplierController);
bindRoutes('materials', materialController);
bindRoutes('units', unitController);

module.exports = router;
