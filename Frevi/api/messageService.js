// api/messages.js
import axios from 'axios';

const messageService = axios.create({
    baseURL: 'http://localhost:9191/api/v1', // Через API Gateway
});

// Додаємо токен до кожного запиту
messageService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Обробка помилок
messageService.interceptors.response.use(
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
export const getMessages = (chatId, params = {}) =>
    messageService.get(`/messages/${chatId}`, { params });

export const getMessageById = (id) => messageService.get(`/messages/view/${id}`);
export const sendMessage = (data) => messageService.post('/messages', data);
export const updateMessage = (id, data) => messageService.put(`/messages/${id}`, data);
export const deleteMessage = (id) => messageService.delete(`/messages/${id}`);

// Додаткові можливості
export const markMessageAsRead = (id) => messageService.get(`/messages/view/${id}`);
export const markMessageAsUnread = (id) => messageService.patch(`/messages/${id}/unread`);

// Діалоги
export const getConversations = (userId, params = {}) =>
    messageService.get(`/chat`, { params: { userId, ...params } });

export const createConversation = (data) => messageService.post('/chat', data);
export const deleteConversation = (chatId) =>
    messageService.delete(`/chat/${chatId}`);

export default messageService;
