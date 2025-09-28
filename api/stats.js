// api/stats.js
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.json({
    totalReports: 1254,
    totalRevenue: 42.5,
    activeUsers: 892,
    satisfaction: 94,
    presaleRaised: 2.45,
    presaleGoal: 10,
    contributors: 3247,
    timestamp: new Date().toISOString()
  });
};