import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chat } from '../../services/api';
import io from 'socket.io-client';

function Chat() {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Create socket connection with better error handling
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
            token: localStorage.getItem('token')
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
    });

    // Add connection event listeners with better logging
    socketRef.current.on('connect', () => {
        console.log('Socket connected successfully:', socketRef.current.id);
        if (currentRoom) {
            socketRef.current.emit('joinRoom', {
                roomId: currentRoom.id,
                userId: user.id,
                username: user.username
            });
        }
    });

    socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('userJoined', (userData) => {
      console.log(`${userData.username} joined the room`);
    });

    socketRef.current.on('userLeft', (userData) => {
      console.log(`${userData.username} left the room`);
    });

    socketRef.current.on('roomUsers', (users) => {
      setRoomUsers(users);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };
  }, [user, currentRoom]);

  useEffect(() => {
    if (!currentRoom || !user || !socketRef.current) return;
    
    loadMessages(currentRoom.id);
    socketRef.current.emit('joinRoom', {
      roomId: currentRoom.id,
      userId: user.id,
      username: user.username
    });
    
    loadRoomUsers(currentRoom.id);
  }, [currentRoom, user]);

  useEffect(() => {
    if (!user) return;
    loadUserRooms();
  }, [user]);

  const loadUserRooms = async () => {
    try {
      const response = await chat.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await chat.getRooms();
      setRooms(response.data);
      if (response.data.length > 0) {
        setCurrentRoom(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await chat.getMessages(roomId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadRoomUsers = async (roomId) => {
    try {
      const response = await chat.getRoomUsers(roomId);
      setRoomUsers(response.data);
    } catch (error) {
      console.error('Error loading room users:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom || !socketRef.current) {
        console.log('Cannot send message:', { 
            message: newMessage, 
            currentRoom: currentRoom, 
            socketConnected: !!socketRef.current 
        });
        return;
    }

    try {
        // First emit through socket for real-time update
        socketRef.current.emit('sendMessage', {
            roomId: currentRoom.id,
            message: newMessage.trim()
        });

        // Then send through HTTP for persistence
        const response = await chat.sendMessage(currentRoom.id, newMessage.trim());
        console.log('Message sent successfully:', response);
        setNewMessage('');
    } catch (error) {
        console.error('Error sending message:', error);
        // Show error to user
        alert('Failed to send message. Please try again.');
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    try {
        if (!newRoomName.trim()) {
            return;
        }

        const response = await chat.createRoom(newRoomName.trim());
        const newRoom = response.data;
        
        setRooms(prevRooms => [...prevRooms, newRoom]);
        setCurrentRoom(newRoom);
        setNewRoomName('');
        setShowCreateRoom(false);

        // Join the socket room
        if (socketRef.current) {
            socketRef.current.emit('joinRoom', {
                roomId: newRoom.id,
                userId: user.id,
                username: user.username
            });
        }
    } catch (error) {
        console.error('Error creating room:', error);
    }
  };

  const joinRoomById = async (e) => {
    e.preventDefault();
    try {
        if (!roomIdToJoin.trim()) {
            console.error('Room ID is required');
            return;
        }

        // First check if room exists
        const roomResponse = await chat.getRoomById(roomIdToJoin.trim());
        const room = roomResponse.data;
        
        if (!room) {
            console.error('Room not found');
            return;
        }

        // Check if already in room
        const isAlreadyInRoom = rooms.some(r => r.id === room.id);
        if (!isAlreadyInRoom) {
            // Join the room
            await chat.joinRoom(room.id);
            
            // Add room to list if not already there
            setRooms(prevRooms => [...prevRooms, room]);
        }
        
        // Set as current room
        setCurrentRoom(room);
        setShowJoinRoom(false);
        setRoomIdToJoin('');

        // Join socket room
        if (socketRef.current) {
            socketRef.current.emit('joinRoom', {
                roomId: room.id,
                userId: user.id,
                username: user.username
            });
        }

        // Load room messages
        await loadMessages(room.id);
        
        // Load room users
        await loadRoomUsers(room.id);

    } catch (error) {
        console.error('Error joining room:', error.response?.data?.error || error.message);
        // You might want to show this error to the user
        // setError(error.response?.data?.error || 'Failed to join room');
    }
};

  return (
    <div className="flex h-screen">
      {/* Rooms Sidebar */}
      <div className="w-1/4 bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
          <button
            onClick={logout}
            className="px-3 py-1 bg-red-500 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        
        <div className="space-y-2 mb-4">
          {/* Create Room Button */}
          <button
            onClick={() => setShowCreateRoom(true)}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Room
          </button>

          {/* Join Room Button */}
          <button
            onClick={() => setShowJoinRoom(true)}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Join Room
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Room</h3>
              <form onSubmit={createRoom}>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room Name"
                  className="w-full px-3 py-2 border rounded-md text-gray-800 mb-4"
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Room Modal */}
        {showJoinRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Join Room</h3>
              {joinError && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {joinError}
                </div>
              )}
              <form onSubmit={async (e) => {
                e.preventDefault();
                setJoinError('');
                try {
                  await joinRoomById(e);
                } catch (error) {
                  setJoinError(error.message || 'Failed to join room');
                }
              }}>
                <input
                  type="text"
                  value={roomIdToJoin}
                  onChange={(e) => {
                    setJoinError('');
                    setRoomIdToJoin(e.target.value);
                  }}
                  placeholder="Enter Room ID"
                  className="w-full px-3 py-2 border rounded-md text-gray-800 mb-4"
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinRoom(false);
                      setJoinError('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room)}
              className={`w-full p-2 text-left rounded ${
                currentRoom?.id === room.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{currentRoom.name}</h3>
              {/* Show online users */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {roomUsers.length} online
                </span>
                <div className="flex -space-x-2">
                  {roomUsers.map((user) => (
                    <div
                      key={user.id}
                      className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm border-2 border-white"
                      title={user.username}
                    >
                      {user.username[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.user_id === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {msg.username}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-md"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat; 

