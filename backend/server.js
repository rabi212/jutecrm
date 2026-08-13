const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const { ensureDatabaseExists, sequelize } = require('./config/database');
const { ensureDefaultAdmin } = require('./config/adminSetup');
const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads folder exists and serve statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration for bill uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: fileUrl });
});

// Register routers
const dbRoutes = require('./routes/dbRoutes');
const masterRoutes = require('./routes/masterRoutes');

app.use('/api', dbRoutes);
app.use('/api/masters', masterRoutes);
app.post('/api/login', authController.login);
app.post('/api/reset-password', authController.resetPassword);

// Database connection & Server Boot
async function startServer() {
  try {
    // 1. Check & Auto-Create Database if not present
    await ensureDatabaseExists();

    // 2. Authenticate connection
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 3. Sync Models (Sync schema changes dynamically)
    await sequelize.sync();
    console.log('Sequelize models synchronized.');

    // 4. Ensure at least one admin user exists
    await ensureDefaultAdmin();

    // 5. Start Express server
    app.listen(PORT, () => {
      console.log(`JuteCRM backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed. Express server could not start:', err);
    process.exit(1);
  }
}

startServer();
