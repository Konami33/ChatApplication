const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    },
});

io.on('connection', (socket) => {
    console.log('A new client connected', socket.id);

    socket.on('chat message', (msg) => {
        console.log('Message: ', msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
    });
})


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


