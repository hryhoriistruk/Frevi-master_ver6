// import axios from 'axios';
//
// const messengerService = axios.create({
//     baseURL: 'http://localhost:9191/api/messenger',
// });
//
// export const MessengerService = {
//     // Отримати всі повідомлення бесіди
//     getConversationMessages: async (conversationId, token) => {
//         try {
//             const response = await messengerService.get(`/conversations/${conversationId}/messages`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching conversation messages:', error);
//             throw error;
//         }
//     },
//
//     // Надіслати повідомлення
//     sendMessage: async (messageData, token) => {
//         try {
//             const response = await messengerService.post('/messages', messageData, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error sending message:', error);
//             throw error;
//         }
//     },
//
//     // Отримати список бесід користувача
//     getUserConversations: async (userId, token) => {
//         try {
//             const response = await messengerService.get(`/users/${userId}/conversations`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching user conversations:', error);
//             throw error;
//         }
//     },
//
//     // Створити нову бесіду
//     createConversation: async (conversationData, token) => {
//         try {
//             const response = await messengerService.post('/conversations', conversationData, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error creating conversation:', error);
//             throw error;
//         }
//     },
//
//     // Отримати деталі бесіди
//     getConversation: async (conversationId, token) => {
//         try {
//             const response = await messengerService.get(`/conversations/${conversationId}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching conversation:', error);
//             throw error;
//         }
//     },
//
//     // Позначити повідомлення як прочитані
//     markAsRead: async (conversationId, messageIds, token) => {
//         try {
//             const response = await messengerService.patch(`/conversations/${conversationId}/read`, {
//                 messageIds
//             }, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error marking messages as read:', error);
//             throw error;
//         }
//     },
//
//     // Надіслати системне повідомлення (для замовлень)
//     sendSystemMessage: async (orderData, token) => {
//         try {
//             const response = await messengerService.post('/messages/system', orderData, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error sending system message:', error);
//             throw error;
//         }
//     },
//
//     // Отримати непрочитані повідомлення
//     getUnreadMessages: async (userId, token) => {
//         try {
//             const response = await messengerService.get(`/users/${userId}/unread`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching unread messages:', error);
//             throw error;
//         }
//     }
// };
// api/messenger.js
import axios from 'axios';

const messengerService = axios.create({
    baseURL: 'http://localhost:9191/api/messenger',
});

// Додаємо токен автоматично
messengerService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Обробка помилок
messengerService.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ---- API Методи ---- //

// Повідомлення
export const getConversationMessages = (conversationId, params = {}) =>
    messengerService.get(`/conversations/${conversationId}/messages`, { params });

export const sendMessage = (messageData) =>
    messengerService.post('/messages', messageData);

export const sendSystemMessage = (orderData) =>
    messengerService.post('/messages/system', orderData);

// Бесіди
export const getUserConversations = (userId, params = {}) =>
    messengerService.get(`/users/${userId}/conversations`, { params });

export const createConversation = (conversationData) =>
    messengerService.post('/conversations', conversationData);

export const getConversation = (conversationId) =>
    messengerService.get(`/conversations/${conversationId}`);

export const deleteConversation = (conversationId) =>
    messengerService.delete(`/conversations/${conversationId}`);

// Статуси
export const markAsRead = (conversationId, messageIds) =>
    messengerService.patch(`/conversations/${conversationId}/read`, { messageIds });

export const getUnreadMessages = (userId) =>
    messengerService.get(`/users/${userId}/unread`);

export default messengerService;

