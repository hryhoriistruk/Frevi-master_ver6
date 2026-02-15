// const express = require('express');
// const cors = require('cors');
// const http = require('http');
// const socketIo = require('socket.io');
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, { cors: { origin: "*" } });
// const PORT = process.env.PORT || 3000;
//
// app.use(cors());
// app.use(express.json());
//
// // Mock data для повідомлень
// let conversations = [
//     { id: 1, userId1: 1, userId2: 2, messages: [] },
//     { id: 2, userId1: 1, userId2: 3, messages: [] }
// ];
//
// let messages = [
//     { id: 1, conversationId: 1, senderId: 1, receiverId: 2, text: "Привіт!", timestamp: new Date(), read: false },
//     { id: 2, conversationId: 1, senderId: 2, receiverId: 1, text: "Привіт! Як справи?", timestamp: new Date(), read: true }
// ];
//
// // Отримати всі діалоги користувача
// app.get('/api/conversations/:userId', (req, res) => {
//     const userId = parseInt(req.params.userId);
//     const userConversations = conversations.filter(conv =>
//         conv.userId1 === userId || conv.userId2 === userId
//     );
//
//     res.json(userConversations);
// });
//
// // Отримати повідомлення діалогу
// app.get('/api/conversations/:conversationId/messages', (req, res) => {
//     const conversationId = parseInt(req.params.conversationId);
//     const conversationMessages = messages.filter(msg => msg.conversationId === conversationId);
//     res.json(conversationMessages);
// });
//
// // Надіслати повідомлення
// app.post('/api/messages', (req, res) => {
//     const { conversationId, senderId, receiverId, text } = req.body;
//
//     const newMessage = {
//         id: messages.length + 1,
//         conversationId,
//         senderId,
//         receiverId,
//         text,
//         timestamp: new Date(),
//         read: false
//     };
//
//     messages.push(newMessage);
//
//     // Відправка через WebSocket
//     io.to(`user_${receiverId}`).emit('new_message', newMessage);
//
//     res.status(201).json(newMessage);
// });
//
// // Позначити повідомлення як прочитані
// app.patch('/api/messages/:messageId/read', (req, res) => {
//     const messageId = parseInt(req.params.messageId);
//     const message = messages.find(msg => msg.id === messageId);
//
//     if (message) {
//         message.read = true;
//         res.json(message);
//     } else {
//         res.status(404).json({ error: 'Message not found' });
//     }
// });
//
// // WebSocket для реального часу
// io.on('connection', (socket) => {
//     console.log('User connected to messaging service');
//
//     socket.on('join_conversation', (userId) => {
//         socket.join(`user_${userId}`);
//         console.log(`User ${userId} joined messaging`);
//     });
//
//     socket.on('send_message', (data) => {
//         const { conversationId, senderId, receiverId, text } = data;
//
//         const newMessage = {
//             id: messages.length + 1,
//             conversationId,
//             senderId,
//             receiverId,
//             text,
//             timestamp: new Date(),
//             read: false
//         };
//
//         messages.push(newMessage);
//
//         // Відправка отримувачу
//         socket.to(`user_${receiverId}`).emit('new_message', newMessage);
//
//         // Підтвердження відправнику
//         socket.emit('message_sent', newMessage);
//     });
//
//     socket.on('disconnect', () => {
//         console.log('User disconnected from messaging');
//     });
// });
//
// // Health check
// app.get('/api/health', (req, res) => {
//     res.json({ status: 'OK', service: 'Messaging Service' });
// });
//
// server.listen(PORT, () => {
//     console.log(`Messaging Service running on port ${PORT}`);
// });

// api/messaging.js (повна інтеграція messaging service)
import axios from "axios";

const API_BASE_URL = 'http://localhost:9191/api';

const messagingService = axios.create({
    baseURL: API_BASE_URL,
});

// Default headers configuration
messagingService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Conversations Management
export const getAllConversations = (userId) => messagingService.get(`/conversations/${userId}`);
export const getConversationById = (conversationId) => messagingService.get(`/conversations/${conversationId}`);
export const createConversation = (conversationData) => messagingService.post('/conversations', conversationData);
export const updateConversation = (conversationId, data) => messagingService.put(`/conversations/${conversationId}`, data);
export const deleteConversation = (conversationId) => messagingService.delete(`/conversations/${conversationId}`);
export const archiveConversation = (conversationId) => messagingService.patch(`/conversations/${conversationId}/archive`);
export const unarchiveConversation = (conversationId) => messagingService.patch(`/conversations/${conversationId}/unarchive`);
export const muteConversation = (conversationId) => messagingService.patch(`/conversations/${conversationId}/mute`);
export const unmuteConversation = (conversationId) => messagingService.patch(`/conversations/${conversationId}/unmute`);

// Messages Management
export const getConversationMessages = (conversationId, params = {}) =>
    messagingService.get(`/conversations/${conversationId}/messages`, { params });
export const getMessageById = (messageId) => messagingService.get(`/messages/${messageId}`);
export const sendMessage = (messageData) => messagingService.post('/messages', messageData);
export const updateMessage = (messageId, data) => messagingService.put(`/messages/${messageId}`, data);
export const deleteMessage = (messageId) => messagingService.delete(`/messages/${messageId}`);
export const markMessageAsRead = (messageId) => messagingService.patch(`/messages/${messageId}/read`);
export const markMessageAsUnread = (messageId) => messagingService.patch(`/messages/${messageId}/unread`);
export const markAllMessagesAsRead = (conversationId) =>
    messagingService.patch(`/conversations/${conversationId}/messages/read-all`);

// Message Search & Filtering
export const searchMessages = (query, params = {}) =>
    messagingService.get('/messages/search', { params: { q: query, ...params } });
export const getUnreadMessages = (userId) => messagingService.get(`/messages/unread/${userId}`);
export const getMessagesByDateRange = (conversationId, startDate, endDate) =>
    messagingService.get(`/conversations/${conversationId}/messages/date-range`, {
        params: { startDate, endDate }
    });

// File & Media Management
export const uploadFile = (formData) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    };
    return messagingService.post('/files/upload', formData, config);
};
export const getFileById = (fileId) => messagingService.get(`/files/${fileId}`);
export const deleteFile = (fileId) => messagingService.delete(`/files/${fileId}`);
export const getFilesByConversation = (conversationId) =>
    messagingService.get(`/conversations/${conversationId}/files`);

// User Status & Presence
export const updateUserStatus = (userId, status) =>
    messagingService.patch(`/users/${userId}/status`, { status });
export const getUserStatus = (userId) => messagingService.get(`/users/${userId}/status`);
export const setUserOnline = (userId) => messagingService.patch(`/users/${userId}/online`);
export const setUserOffline = (userId) => messagingService.patch(`/users/${userId}/offline`);
export const getOnlineUsers = () => messagingService.get('/users/online');

// Typing Indicators
export const startTyping = (conversationId, userId) =>
    messagingService.post('/typing/start', { conversationId, userId });
export const stopTyping = (conversationId, userId) =>
    messagingService.post('/typing/stop', { conversationId, userId });

// Message Reactions
export const addReaction = (messageId, reaction) =>
    messagingService.post(`/messages/${messageId}/reactions`, { reaction });
export const removeReaction = (messageId, reactionId) =>
    messagingService.delete(`/messages/${messageId}/reactions/${reactionId}`);
export const getMessageReactions = (messageId) => messagingService.get(`/messages/${messageId}/reactions`);

// Group Conversations
export const createGroupConversation = (groupData) => messagingService.post('/conversations/group', groupData);
export const addUserToGroup = (conversationId, userId) =>
    messagingService.post(`/conversations/${conversationId}/members`, { userId });
export const removeUserFromGroup = (conversationId, userId) =>
    messagingService.delete(`/conversations/${conversationId}/members/${userId}`);
export const updateGroupInfo = (conversationId, groupData) =>
    messagingService.put(`/conversations/${conversationId}/group-info`, groupData);
export const leaveGroup = (conversationId, userId) =>
    messagingService.post(`/conversations/${conversationId}/leave`, { userId });
export const promoteToAdmin = (conversationId, userId) =>
    messagingService.patch(`/conversations/${conversationId}/members/${userId}/promote`);
export const demoteFromAdmin = (conversationId, userId) =>
    messagingService.patch(`/conversations/${conversationId}/members/${userId}/demote`);

// Message Threading
export const replyToMessage = (messageId, replyData) =>
    messagingService.post(`/messages/${messageId}/reply`, replyData);
export const getMessageReplies = (messageId) => messagingService.get(`/messages/${messageId}/replies`);
export const forwardMessage = (messageId, conversationIds) =>
    messagingService.post(`/messages/${messageId}/forward`, { conversationIds });

// Notifications Management
export const getNotificationSettings = (userId) =>
    messagingService.get(`/users/${userId}/notification-settings`);
export const updateNotificationSettings = (userId, settings) =>
    messagingService.put(`/users/${userId}/notification-settings`, settings);
export const markNotificationAsRead = (notificationId) =>
    messagingService.patch(`/notifications/${notificationId}/read`);

// Message Templates & Quick Replies
export const getMessageTemplates = (userId) => messagingService.get(`/users/${userId}/templates`);
export const createMessageTemplate = (templateData) => messagingService.post('/templates', templateData);
export const updateMessageTemplate = (templateId, data) =>
    messagingService.put(`/templates/${templateId}`, data);
export const deleteMessageTemplate = (templateId) => messagingService.delete(`/templates/${templateId}`);

// Analytics & Statistics
export const getConversationStats = (conversationId) =>
    messagingService.get(`/conversations/${conversationId}/stats`);
export const getUserMessagingStats = (userId) => messagingService.get(`/users/${userId}/stats`);
export const getSystemMessagingStats = () => messagingService.get('/system/stats');

// Message Encryption & Security
export const getPublicKey = (userId) => messagingService.get(`/users/${userId}/public-key`);
export const updatePublicKey = (userId, publicKey) =>
    messagingService.put(`/users/${userId}/public-key`, { publicKey });
export const reportMessage = (messageId, reason) =>
    messagingService.post(`/messages/${messageId}/report`, { reason });
export const blockUser = (userId, blockedUserId) =>
    messagingService.post(`/users/${userId}/block`, { blockedUserId });
export const unblockUser = (userId, blockedUserId) =>
    messagingService.delete(`/users/${userId}/block/${blockedUserId}`);
export const getBlockedUsers = (userId) => messagingService.get(`/users/${userId}/blocked`);

// Health Check
export const getHealthStatus = () => messagingService.get('/health');

// API route handler for Next.js
export default async function handler(req, res) {
    const { method, query, body, headers } = req;
    const { id, action, type, userId, conversationId, messageId } = query;

    try {
        // Optional: Verify user authentication
        const token = headers.authorization?.replace('Bearer ', '');

        let response;

        switch (method) {
            case 'GET':
                if (type === 'conversations' && userId) {
                    response = await getAllConversations(userId);
                } else if (type === 'conversation' && id) {
                    response = await getConversationById(id);
                } else if (type === 'messages' && conversationId) {
                    response = await getConversationMessages(conversationId, query);
                } else if (type === 'message' && id) {
                    response = await getMessageById(id);
                } else if (type === 'unread-messages' && userId) {
                    response = await getUnreadMessages(userId);
                } else if (type === 'search-messages') {
                    response = await searchMessages(query.q, query);
                } else if (type === 'user-status' && userId) {
                    response = await getUserStatus(userId);
                } else if (type === 'online-users') {
                    response = await getOnlineUsers();
                } else if (type === 'message-reactions' && messageId) {
                    response = await getMessageReactions(messageId);
                } else if (type === 'message-replies' && messageId) {
                    response = await getMessageReplies(messageId);
                } else if (type === 'notification-settings' && userId) {
                    response = await getNotificationSettings(userId);
                } else if (type === 'templates' && userId) {
                    response = await getMessageTemplates(userId);
                } else if (type === 'conversation-stats' && conversationId) {
                    response = await getConversationStats(conversationId);
                } else if (type === 'user-stats' && userId) {
                    response = await getUserMessagingStats(userId);
                } else if (type === 'system-stats') {
                    response = await getSystemMessagingStats();
                } else if (type === 'blocked-users' && userId) {
                    response = await getBlockedUsers(userId);
                } else if (type === 'files' && conversationId) {
                    response = await getFilesByConversation(conversationId);
                } else if (type === 'file' && id) {
                    response = await getFileById(id);
                } else if (type === 'health') {
                    response = await getHealthStatus();
                } else if (type === 'public-key' && userId) {
                    response = await getPublicKey(userId);
                }
                break;

            case 'POST':
                if (type === 'conversations') {
                    response = await createConversation(body);
                } else if (type === 'group-conversations') {
                    response = await createGroupConversation(body);
                } else if (type === 'messages') {
                    response = await sendMessage(body);
                } else if (type === 'message-reply' && messageId) {
                    response = await replyToMessage(messageId, body);
                } else if (type === 'message-forward' && messageId) {
                    response = await forwardMessage(messageId, body.conversationIds);
                } else if (type === 'file-upload') {
                    response = await uploadFile(body);
                } else if (type === 'typing-start') {
                    response = await startTyping(body.conversationId, body.userId);
                } else if (type === 'typing-stop') {
                    response = await stopTyping(body.conversationId, body.userId);
                } else if (type === 'reaction' && messageId) {
                    response = await addReaction(messageId, body.reaction);
                } else if (type === 'add-group-member' && conversationId) {
                    response = await addUserToGroup(conversationId, body.userId);
                } else if (type === 'leave-group' && conversationId) {
                    response = await leaveGroup(conversationId, body.userId);
                } else if (type === 'templates') {
                    response = await createMessageTemplate(body);
                } else if (type === 'report-message' && messageId) {
                    response = await reportMessage(messageId, body.reason);
                } else if (type === 'block-user' && userId) {
                    response = await blockUser(userId, body.blockedUserId);
                }
                break;

            case 'PUT':
                if (type === 'conversations' && id) {
                    response = await updateConversation(id, body);
                } else if (type === 'messages' && id) {
                    response = await updateMessage(id, body);
                } else if (type === 'group-info' && conversationId) {
                    response = await updateGroupInfo(conversationId, body);
                } else if (type === 'notification-settings' && userId) {
                    response = await updateNotificationSettings(userId, body);
                } else if (type === 'templates' && id) {
                    response = await updateMessageTemplate(id, body);
                } else if (type === 'public-key' && userId) {
                    response = await updatePublicKey(userId, body.publicKey);
                }
                break;

            case 'PATCH':
                if (type === 'messages' && id && action === 'read') {
                    response = await markMessageAsRead(id);
                } else if (type === 'messages' && id && action === 'unread') {
                    response = await markMessageAsUnread(id);
                } else if (type === 'conversations' && id && action === 'read-all') {
                    response = await markAllMessagesAsRead(id);
                } else if (type === 'conversations' && id && action === 'archive') {
                    response = await archiveConversation(id);
                } else if (type === 'conversations' && id && action === 'unarchive') {
                    response = await unarchiveConversation(id);
                } else if (type === 'conversations' && id && action === 'mute') {
                    response = await muteConversation(id);
                } else if (type === 'conversations' && id && action === 'unmute') {
                    response = await unmuteConversation(id);
                } else if (type === 'user-status' && userId) {
                    response = await updateUserStatus(userId, body.status);
                } else if (type === 'user-online' && userId) {
                    response = await setUserOnline(userId);
                } else if (type === 'user-offline' && userId) {
                    response = await setUserOffline(userId);
                } else if (type === 'promote-admin' && conversationId && userId) {
                    response = await promoteToAdmin(conversationId, userId);
                } else if (type === 'demote-admin' && conversationId && userId) {
                    response = await demoteFromAdmin(conversationId, userId);
                } else if (type === 'notifications' && id && action === 'read') {
                    response = await markNotificationAsRead(id);
                }
                break;

            case 'DELETE':
                if (type === 'conversations' && id) {
                    response = await deleteConversation(id);
                } else if (type === 'messages' && id) {
                    response = await deleteMessage(id);
                } else if (type === 'files' && id) {
                    response = await deleteFile(id);
                } else if (type === 'reaction' && messageId && id) {
                    response = await removeReaction(messageId, id);
                } else if (type === 'group-member' && conversationId && userId) {
                    response = await removeUserFromGroup(conversationId, userId);
                } else if (type === 'templates' && id) {
                    response = await deleteMessageTemplate(id);
                } else if (type === 'unblock-user' && userId && id) {
                    response = await unblockUser(userId, id);
                }
                break;

            default:
                res.status(405).json({ error: 'Method not allowed' });
                return;
        }

        res.status(200).json(response?.data || response);
    } catch (error) {
        console.error('Messaging Service Error:', error);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || error.message
        });
    }
}