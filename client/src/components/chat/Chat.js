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
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to socket
    socketRef.current = io('http://localhost:5000');

    // Load rooms
    loadRooms();

    // Socket event listeners
    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom.id);
      socketRef.current.emit('joinRoom', currentRoom.id);
    }
  }, [currentRoom]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      socketRef.current.emit('sendMessage', {
        roomId: currentRoom.id,
        userId: user.id,
        message: newMessage
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
            <div className="bg-gray-100 p-4 border-b">
              <h3 className="text-xl font-bold">{currentRoom.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.user_id === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.user_id === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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

