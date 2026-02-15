// import axios from 'axios';
//
// const API_BASE_URL = 'http://localhost:9191/api';
//
// export const UserService = {
//     // Отримати всіх користувачів
//     getAllUsers: async (token) => {
//         try {
//             const response = await axios.get(`${API_BASE_URL}/users`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching users:', error);
//             throw error;
//         }
//     },
//
//     // Отримати користувача по ID
//     getUserById: async (id, token) => {
//         try {
//             const response = await axios.get(`${API_BASE_URL}/users/${id}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching user:', error);
//             throw error;
//         }
//     },
//
//     // Отримати користувача по email
//     getUserByEmail: async (email, token) => {
//         try {
//             const response = await axios.get(`${API_BASE_URL}/users/email/${encodeURIComponent(email)}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching user by email:', error);
//             throw error;
//         }
//     },
//
//     // Створити користувача
//     createUser: async (user) => {
//         try {
//             const response = await axios.post(`${API_BASE_URL}/users`, user);
//             return response.data;
//         } catch (error) {
//             console.error('Error creating user:', error);
//             throw error;
//         }
//     },
//
//     // Логін користувача
//     login: async (email, password) => {
//         try {
//             const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
//             return response.data;
//         } catch (error) {
//             console.error('Login failed:', error);
//             throw error;
//         }
//     },
//
//     // Оновлення користувача
//     updateUser: async (id, userData, token) => {
//         try {
//             const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error updating user:', error);
//             throw error;
//         }
//     },
//
//     // Видалення користувача
//     deleteUser: async (id, token) => {
//         try {
//             const response = await axios.delete(`${API_BASE_URL}/users/${id}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error deleting user:', error);
//             throw error;
//         }
//     },
//
//     // Отримати статистику користувача
//     getUserStats: async (userId, token) => {
//         try {
//             const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching user stats:', error);
//             throw error;
//         }
//     }
// };
// api/users.js
import axios from 'axios';

const userService = axios.create({
    baseURL: 'http://localhost:9191/api/v1/users',
});

// Додаємо токен до кожного запиту
userService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Обробка помилок
userService.interceptors.response.use(
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

// Користувачі
export const getAllUsers = (params = {}) => userService.get('', { params });
export const getUserById = (id) => userService.get(`/${id}`);
export const createUser = (userData) => userService.post('', userData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteUser = (id) => userService.delete(`/${id}`);

// Примітка: getUserByEmail, updateUser, getUserStats можуть потребувати реалізації в бекенді
export const getUserByEmail = (email) => userService.get(`/email/${encodeURIComponent(email)}`);
export const updateUser = (id, userData) => userService.put(`/${id}`, userData);
export const getUserStats = (userId) => userService.get(`/${userId}/stats`);

// Аутентифікація (через інший endpoint, не /users)
export const login = (email, password) =>
    axios.post('http://localhost:9191/api/v1/auth/login', { email, password });

export default userService;
