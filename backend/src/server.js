const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const store = require('./models/store');
const apiRoutes = require('./routes/apiRoutes');
const ruleEngine = require('./services/ruleEngineService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint (SRS T-SET-02)
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'Kosh-Drishti Backend API',
    timestamp: new Date().toISOString()
  });
});

// API Router
app.use('/api', apiRoutes);

// Serve static frontend in production if built
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(frontendBuildPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Kosh-Drishti Backend API is running. Frontend dev server running on port 5173.');
  }
});

// Auto-seed if database is unseeded
if (store.getWorks().length === 0) {
  console.log('Database empty on startup. Triggering initial seed...');
  require('./seed/seedData');
}

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Kosh-Drishti API Server running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
