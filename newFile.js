const authRoutes = require('./routes/auth');
const { app } = require('./server');

app.use('/api/auth', authRoutes);
