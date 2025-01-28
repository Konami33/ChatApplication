const socketIO = require('socket.io');
const { sendMessage } = require('./controllers/chatController');

/**
 * Configures the Socket.IO server and sets up event listeners.
 * @param {http.Server} server - The HTTP server instance.
 * @returns {SocketIO.Server} - Configured Socket.IO instance.
 */

const configureSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST']
        },
    });

    io.on('connection', (socket) => {
        console.log(`A new client connected: ${socket.id}`);

        socket.on('joinRoom', (roomId) => {
            if(!roomId) {
                return socket.emit('error', 'Room ID is required');
            }
            socket.join(roomId);
            console.log(`Client ${socket.id} joined room ${roomId}`);
        });

        socket.on('sendMessage', async ({ roomId, userId, message }) => {
            try {
                if (!roomId || !userId || !message) {
                    return socket.emit('error', { message: 'Invalid message payload. Room ID, User ID, and message are required.' });
                }
    
    
                const savedMessage = await sendMessage(roomId, userId, message);
    
                io.to(roomId).emit('receiveMessage', savedMessage);
                console.log(`Message sent to room ${roomId} by user ${userId}`);
            } catch (error) {
                console.error('Error saving message:', error.message);
                socket.emit('error', { message: error.message });
            }

        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = configureSocket;

