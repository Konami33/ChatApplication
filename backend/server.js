const express = require('express');
const http = require('http');
const cors = require('cors');
const configureSocket = require('./socket');
// const authRoutes = require('./routes/authRoutes');
// const chatRoutes = require('./routes/chatRoutes');
const { connectDb } = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = configureSocket(server);


app.use(cors());
app.use(express.json());

// const io = new Server(server, {
//     cors: {
//         origin: 'http://localhost:3000',
//         methods: ['GET', 'POST']
//     },
// });


// Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);

//default route to check if the server is running
app.get('/', (req, res) => {
    res.send('Hello World');
});


connectDb().then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});


