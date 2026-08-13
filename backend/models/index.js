const Buyer = require('./Buyer');
const Customer = require('./Customer');
const Cutter = require('./Cutter');
const Fabricator = require('./Fabricator');
const Finisher = require('./Finisher');
const Printer = require('./Printer');
const Supplier = require('./Supplier');
const RawMaterial = require('./RawMaterial');
const Unit = require('./Unit');

const PI = require('./PI');
const PIProduct = require('./PIProduct');
const PO = require('./PO');
const POItem = require('./POItem');
const Receipt = require('./Receipt');
const ReceiptItem = require('./ReceiptItem');
const Cutting = require('./Cutting');
const CuttingItem = require('./CuttingItem');

const PrinterIssue = require('./PrinterIssue');
const PrinterReceive = require('./PrinterReceive');
const StitcherIssue = require('./StitcherIssue');
const StitcherReceive = require('./StitcherReceive');
const Finishing = require('./Finishing');
const Shipment = require('./Shipment');
const User = require('./User');

// ==========================================
// ASSOCIATIONS
// ==========================================

PI.hasMany(PIProduct, { as: 'products', foreignKey: 'piId', onDelete: 'CASCADE' });
PIProduct.belongsTo(PI, { foreignKey: 'piId' });

PO.hasMany(POItem, { as: 'items', foreignKey: 'poId', onDelete: 'CASCADE' });
POItem.belongsTo(PO, { foreignKey: 'poId' });

Receipt.hasMany(ReceiptItem, { as: 'items', foreignKey: 'receiptId', onDelete: 'CASCADE' });
ReceiptItem.belongsTo(Receipt, { foreignKey: 'receiptId' });

Cutting.hasMany(CuttingItem, { as: 'items', foreignKey: 'cuttingId', onDelete: 'CASCADE' });
CuttingItem.belongsTo(Cutting, { foreignKey: 'cuttingId' });

module.exports = {
  Buyer,
  Customer,
  Cutter,
  Fabricator,
  Finisher,
  Printer,
  Supplier,
  RawMaterial,
  Unit,
  PI,
  PIProduct,
  PO,
  POItem,
  Receipt,
  ReceiptItem,
  Cutting,
  CuttingItem,
  PrinterIssue,
  PrinterReceive,
  StitcherIssue,
  StitcherReceive,
  Finishing,
  Shipment,
  User
};
