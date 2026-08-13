const { Supplier } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const items = await Supplier.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await Supplier.create(req.body);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    await Supplier.update(req.body, { where: { id } });
    const updated = await Supplier.findByPk(id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Supplier.destroy({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
