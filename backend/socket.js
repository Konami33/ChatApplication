const socketIO = require('socket.io');

const configureSocket = (server) => {
    const io = socketIO(server);

    io.on('connection', (socket) => {
        console.log('a new client connected', socket.id);

        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`A client joined room ${roomId}`);
        });

        socket.on('sendMessage', async ({ roomId, userId, message }) => {
            const savedMessage = await saveMessage(roomId, userId, message);
            io.to(roomId).emit('receiveMessage', savedMessage);
          });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = configureSocket;

