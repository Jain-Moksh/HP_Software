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
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const sellerAdjustmentRoutes = require('./routes/sellerAdjustmentRoutes');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Main Routes
app.use('/api/jobbers', jobberRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/job-report', jobReportRoutes);
app.use('/api/seller-report', sellerReportRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/seller-adjustments', sellerAdjustmentRoutes);

app.get('/api', (req, res) => {
    res.send('HP Accounting Backend Running');
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const { exec } = require('child_process');
const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.listen(PORT, () => {
    const localIp = getLocalIp();
    const url = `http://${localIp}:${PORT}`;
    console.log(`Server is running on: ${url}`);
    
    // Automatically open browser
    const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
    exec(`${start} ${url}`);
});
