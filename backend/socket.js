const { Server } = require('socket.io');
const { sendMessage } = require('./controllers/chatController');
//const { Room, Message } = require('./models');
const Room = require('./models/Room');
const Message = require('./models/Message');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

/**
 * Configures the Socket.IO server and sets up event listeners.
 * @param {http.Server} server - The HTTP server instance.
 * @returns {SocketIO.Server} - Configured Socket.IO instance.
 */

const configureSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Authorization"]
        },
        transports: ['websocket'],
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Improve authentication middleware with better error handling
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error('No token provided for socket connection');
            return next(new Error('Authentication token required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            console.log('Socket authenticated for user:', decoded.userId);
            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            next(new Error('Invalid authentication token'));
        }
    });

    // Track connected users
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('joinRoom', async ({ roomId, userId, username }) => {
            if(!roomId) {
                return socket.emit('error', 'Room ID is required');
            }

            // Leave previous room if any
            if (socket.roomId) {
                socket.leave(socket.roomId);
                await Room.removeUserFromRoom(socket.roomId, userId);
                io.to(socket.roomId).emit('userLeft', { userId, username });
            }

            // Join new room
            socket.join(roomId);
            socket.roomId = roomId;
            socket.userId = userId;
            
            await Room.addUserToRoom(roomId, userId);
            
            // Broadcast to room that user joined
            io.to(roomId).emit('userJoined', { userId, username });
            
            // Send updated user list to all clients in room
            const roomUsers = await Room.getRoomUsers(roomId);
            io.to(roomId).emit('roomUsers', roomUsers);
        });

        socket.on('sendMessage', async ({ roomId, message }) => {
            try {
                if (!socket.userId || !roomId || !message) {
                    console.error('Invalid message data:', { userId: socket.userId, roomId, message });
                    return socket.emit('error', 'Invalid message data');
                }

                // Verify user is member of room
                const roomUsers = await Room.getRoomUsers(roomId);
                const isMember = roomUsers.some(user => user.id === socket.userId);
                if (!isMember) {
                    console.error('User not in room:', { userId: socket.userId, roomId });
                    return socket.emit('error', 'You are not a member of this room');
                }

                // Create the message in the database
                const newMessage = await Message.create(roomId, socket.userId, message);
                
                // Get the user information
                const user = await User.findById(socket.userId);
                if (!user) {
                    console.error('User not found:', socket.userId);
                    return socket.emit('error', 'User not found');
                }

                const messageWithUser = {
                    ...newMessage,
                    username: user.username,
                    user_id: socket.userId
                };

                // Broadcast to all clients in the room
                io.to(roomId).emit('receiveMessage', messageWithUser);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });

        socket.on('disconnect', async () => {
            if (socket.roomId && socket.userId) {
                await Room.removeUserFromRoom(socket.roomId, socket.userId);
                io.to(socket.roomId).emit('userLeft', { 
                    userId: socket.userId 
                });
                const roomUsers = await Room.getRoomUsers(socket.roomId);
                io.to(socket.roomId).emit('roomUsers', roomUsers);
            }
        });
    });

    return io;
};

module.exports = configureSocket;

