import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const Community = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to Socket.io server
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to Community Socket');
            newSocket.emit('joinRoom', 'local-community-1'); // Placeholder for geofenced room
        });

        newSocket.on('receiveMessage', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => newSocket.close();
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            const messageData = {
                room: 'local-community-1',
                message: {
                    id: Date.now(),
                    text: newMessage,
                    sender: 'Citizen-X9K8A', // Placeholder for anonymous ID
                    timestamp: new Date().toLocaleTimeString(),
                }
            };
            socket.emit('sendMessage', messageData);
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-text">Local Community</h1>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Within 5 KM
                </span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border p-4 flex flex-col mb-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-text/50">
                            No messages yet in your area. Be the first to start the discussion!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className="flex flex-col">
                                <span className="text-xs font-bold text-primary mb-1">{msg.sender}</span>
                                <div className="bg-surface self-start py-2 px-4 rounded-2xl rounded-tl-none inline-block max-w-[80%]">
                                    <p className="text-text">{msg.text}</p>
                                    <span className="text-[10px] text-text/50 mt-1 block">{msg.timestamp}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Discuss local issues anonymously..."
                        className="flex-1 bg-surface border border-border rounded-full px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="bg-primary hover:bg-primary/90 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Community;
