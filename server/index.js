require('dotenv').config();
const express = require('express');
const cors = require('cors');
const materialRoutes = require('./routes/materialRoutes');
const jobReportRoutes = require('./routes/jobReportRoutes');
const jobberRoutes = require('./routes/jobberRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/material', materialRoutes);
app.use('/api/job-report', jobReportRoutes);
app.use('/api/jobbers', jobberRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.send('HP Accounting Backend is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
