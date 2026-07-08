const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const issueRoutes = require('./routes/issueRoutes');


// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI)
    .then(conn => console.log(`MongoDB Connected: ${conn.connection.host}`))
    .catch(error => {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Body parser with increased limit for Base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/issues', issueRoutes);


// Basic route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
