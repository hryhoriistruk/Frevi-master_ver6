import axios from "axios";
import io from 'socket.io-client';

const messagingService = axios.create({
    baseURL: 'http://localhost:9191/api/v1',
});

let socket = null;

export const connectMessaging = (userId) => {
    socket = io('http://localhost:9191');
    socket.emit('join_conversation', userId);
    return socket;
};

export const disconnectMessaging = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { conversationId, senderId, receiverId, text } = req.body;

        try {
            const response = await messagingService.post('/messages', {
                conversationId,
                senderId,
                receiverId,
                text
            });

            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const getConversations = (userId) => messagingService.get(`/chat`);
export const getMessages = (chatId) => messagingService.get(`/messages/${chatId}`);
export const sendMessage = (messageData) => messagingService.post('/messages', messageData);
export const markAsRead = (messageId) => messagingService.get(`/messages/view/${messageId}`);
export const createConversation = (chatRequest) => messagingService.post('/chat', chatRequest);

// WebSocket events
export const onNewMessage = (callback) => {
    if (socket) {
        socket.on('new_message', callback);
    }
};

export const onMessageSent = (callback) => {
    if (socket) {
        socket.on('message_sent', callback);
    }
};

export const offNewMessage = () => {
    if (socket) {
        socket.off('new_message');
    }
};