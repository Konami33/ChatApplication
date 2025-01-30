const express = require('express');
const http = require('http');
const cors = require('cors');
const configureSocket = require('./socket');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const { connectDb } = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = configureSocket(server);


app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);


//default route to check if the server is running
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Handle undefined routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});


// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});


connectDb().then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});


