const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API routes
app.get('/api/stats', (req, res) => {
    res.json({
        totalReports: 1254,
        totalRevenue: 42.5,
        activeUsers: 892,
        satisfaction: 94,
        presaleRaised: 2.45,
        presaleGoal: 10,
        contributors: 3247
    });
});

app.get('/api/contributions', (req, res) => {
    res.json([
        { address: '0x8f7d...4c2a', amount: 12500, timestamp: new Date() },
        { address: '0x3b2a...9e1f', amount: 5200, timestamp: new Date(Date.now() - 15 * 60000) },
        { address: '0x6d91...7b34', amount: 23100, timestamp: new Date(Date.now() - 60 * 60000) }
    ]);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server (only if not in Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`GenetAi server running on http://localhost:${PORT}`);
        console.log(`- Main site: http://localhost:${PORT}/`);
        console.log(`- Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`- Documentation: http://localhost:${3000}/docs`);
    });
}

module.exports = app;