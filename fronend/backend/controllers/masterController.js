const models = require('../models');

const makeCrud = (Model) => ({
  getAll: async (req, res) => {
    try {
      const items = await Model.findAll();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      await Model.update(req.body, { where: { id } });
      const updated = await Model.findByPk(id);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await Model.destroy({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = {
  buyers: makeCrud(models.Buyer),
  customers: makeCrud(models.Customer),
  cutters: makeCrud(models.Cutter),
  fabricators: makeCrud(models.Fabricator),
  finishers: makeCrud(models.Finisher),
  printers: makeCrud(models.Printer),
  suppliers: makeCrud(models.Supplier),
  materials: makeCrud(models.RawMaterial),
  units: makeCrud(models.Unit)
};
