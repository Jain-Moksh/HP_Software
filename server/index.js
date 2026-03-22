const express = require('express');
const cors = require('cors');
require('dotenv').config();

const jobberRoutes = require('./routes/jobberRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const stockRoutes = require('./routes/stockRoutes');
const jobReportRoutes = require('./routes/jobReportRoutes');
const sellerReportRoutes = require('./routes/sellerReportRoutes');
const materialRoutes = require('./routes/materialRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const sellerAdjustmentRoutes = require('./routes/sellerAdjustmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/jobbers', jobberRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/job-report', jobReportRoutes);
app.use('/api/seller-report', sellerReportRoutes);
app.use('/api/material', materialRoutes);
app.use('/api/adjustments', adjustmentRoutes);

app.get('/', (req, res) => {
    res.send('HP Accounting Backend Running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
