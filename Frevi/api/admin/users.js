// import { adminAuth } from '../../../firebase/init';
// import axios from "axios";
//
// const adminService = axios.create({
//     baseURL: 'http://localhost:9191/api/admin', // Базовий URL для адмін сервісу
// });
//
// export default async function handler(req, res) {
//     if (req.method === 'GET') {
//         const users = await adminAuth.listUsers();
//         res.status(200).json(users);
//     }
// }
//
// adminService.interceptors.request.use((config) => {
//     const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
//
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//
//     config.headers['Content-Type'] = 'application/json';
//     return config;
// });
//
//
// export const getAllUsers = () => adminService.get('/users');
// export const getUserById = (id) => adminService.get(`/users/${id}`);
// export const updateUser = (id, data) => adminService.put(`/users/${id}`, data);
// export const deleteUser = (id) => adminService.delete(`/users/${id}`);
// export const banUser = (id) => adminService.patch(`/users/${id}/ban`);
// export const unbanUser = (id) => adminService.patch(`/users/${id}/unban`);
//
//
// export const getStatistics = () => adminService.get('/statistics');
// export const getAnalytics = (period) => adminService.get(`/analytics?period=${period}`);
//
//
// export const getAllOrders = () => adminService.get('/orders');
// export const getOrderById = (id) => adminService.get(`/orders/${id}`);
// export const updateOrderStatus = (id, status) => adminService.patch(`/orders/${id}/status`, { status });
// export const deleteOrder = (id) => adminService.delete(`/orders/${id}`);

// api/users.js (повна адмін інтеграція)
import axios from "axios";

const adminService = axios.create({
    baseURL: 'http://localhost:9191/api/admin',
});

// Default headers configuration
adminService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Users Management
export const getAllUsers = (params = {}) => adminService.get('/users', { params });
export const getUserById = (id) => adminService.get(`/users/${id}`);
export const createUser = (userData) => adminService.post('/users', userData);
export const updateUser = (id, data) => adminService.put(`/users/${id}`, data);
export const deleteUser = (id) => adminService.delete(`/users/${id}`);
export const banUser = (id) => adminService.patch(`/users/${id}/ban`);
export const unbanUser = (id) => adminService.patch(`/users/${id}/unban`);
export const searchUsers = (query, params = {}) =>
    adminService.get('/users/search', { params: { q: query, ...params } });

// Statistics & Analytics
export const getStatistics = () => adminService.get('/statistics');
export const getAnalytics = (period = 'monthly') => adminService.get(`/analytics?period=${period}`);
export const getDashboardData = () => adminService.get('/dashboard');
export const getRevenueReports = (startDate, endDate) =>
    adminService.get('/reports/revenue', { params: { startDate, endDate } });
export const getUserGrowth = (period = 'yearly') =>
    adminService.get('/reports/user-growth', { params: { period } });

// Orders Management
export const getAllOrders = (params = {}) => adminService.get('/orders', { params });
export const getOrderById = (id) => adminService.get(`/orders/${id}`);
export const createOrder = (orderData) => adminService.post('/orders', orderData);
export const updateOrder = (id, data) => adminService.put(`/orders/${id}`, data);
export const updateOrderStatus = (id, status) => adminService.patch(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => adminService.delete(`/orders/${id}`);
export const searchOrders = (query, params = {}) =>
    adminService.get('/orders/search', { params: { q: query, ...params } });

// Products/Services Management
export const getAllProducts = (params = {}) => adminService.get('/products', { params });
export const getProductById = (id) => adminService.get(`/products/${id}`);
export const createProduct = (productData) => adminService.post('/products', productData);
export const updateProduct = (id, data) => adminService.put(`/products/${id}`, data);
export const deleteProduct = (id) => adminService.delete(`/products/${id}`);
export const updateProductStock = (id, stock) =>
    adminService.patch(`/products/${id}/stock`, { stock });

// Categories Management
export const getAllCategories = () => adminService.get('/categories');
export const getCategoryById = (id) => adminService.get(`/categories/${id}`);
export const createCategory = (categoryData) => adminService.post('/categories', categoryData);
export const updateCategory = (id, data) => adminService.put(`/categories/${id}`, data);
export const deleteCategory = (id) => adminService.delete(`/categories/${id}`);

// Content Management
export const getAllContent = (params = {}) => adminService.get('/content', { params });
export const getContentById = (id) => adminService.get(`/content/${id}`);
export const createContent = (contentData) => adminService.post('/content', contentData);
export const updateContent = (id, data) => adminService.put(`/content/${id}`, data);
export const deleteContent = (id) => adminService.delete(`/content/${id}`);
export const publishContent = (id) => adminService.patch(`/content/${id}/publish`);
export const unpublishContent = (id) => adminService.patch(`/content/${id}/unpublish`);

// Settings & Configuration
export const getSettings = () => adminService.get('/settings');
export const updateSettings = (settingsData) => adminService.put('/settings', settingsData);
export const getSystemInfo = () => adminService.get('/system/info');
export const getServerStatus = () => adminService.get('/system/status');

// Authentication & Authorization
export const adminLogin = (credentials) => adminService.post('/auth/login', credentials);
export const adminLogout = () => adminService.post('/auth/logout');
export const getAdminProfile = () => adminService.get('/auth/profile');
export const updateAdminProfile = (profileData) => adminService.put('/auth/profile', profileData);
export const changeAdminPassword = (passwordData) => adminService.patch('/auth/password', passwordData);

// Backup & Maintenance
export const createBackup = () => adminService.post('/system/backup');
export const restoreBackup = (backupData) => adminService.post('/system/restore', backupData);
export const cleanupDatabase = () => adminService.post('/system/cleanup');
export const getDatabaseStats = () => adminService.get('/system/database-stats');

// Notifications & Logs
export const getAllNotifications = (params = {}) => adminService.get('/notifications', { params });
export const markNotificationAsRead = (id) => adminService.patch(`/notifications/${id}/read`);
export const deleteNotification = (id) => adminService.delete(`/notifications/${id}`);
export const getSystemLogs = (params = {}) => adminService.get('/system/logs', { params });
export const clearSystemLogs = () => adminService.delete('/system/logs');

// API route handler for Next.js
export default async function handler(req, res) {
    const { method, query, body, headers } = req;
    const { id, action, type, period } = query;

    try {
        // Verify admin authentication
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Admin authentication required' });
        }

        let response;

        switch (method) {
            case 'GET':
                if (type === 'users' && id) {
                    response = await getUserById(id);
                } else if (type === 'users') {
                    response = await getAllUsers(query);
                } else if (type === 'orders' && id) {
                    response = await getOrderById(id);
                } else if (type === 'orders') {
                    response = await getAllOrders(query);
                } else if (type === 'products' && id) {
                    response = await getProductById(id);
                } else if (type === 'products') {
                    response = await getAllProducts(query);
                } else if (type === 'statistics') {
                    response = await getStatistics();
                } else if (type === 'analytics') {
                    response = await getAnalytics(period);
                } else if (type === 'dashboard') {
                    response = await getDashboardData();
                } else if (type === 'settings') {
                    response = await getSettings();
                } else if (type === 'categories') {
                    response = await getAllCategories();
                } else if (type === 'content') {
                    response = await getAllContent(query);
                } else if (type === 'system-info') {
                    response = await getSystemInfo();
                } else if (type === 'notifications') {
                    response = await getAllNotifications(query);
                } else if (type === 'logs') {
                    response = await getSystemLogs(query);
                }
                break;

            case 'POST':
                if (type === 'users') {
                    response = await createUser(body);
                } else if (type === 'orders') {
                    response = await createOrder(body);
                } else if (type === 'products') {
                    response = await createProduct(body);
                } else if (type === 'categories') {
                    response = await createCategory(body);
                } else if (type === 'content') {
                    response = await createContent(body);
                } else if (type === 'auth-login') {
                    response = await adminLogin(body);
                } else if (type === 'backup') {
                    response = await createBackup();
                }
                break;

            case 'PUT':
                if (type === 'users' && id) {
                    response = await updateUser(id, body);
                } else if (type === 'orders' && id) {
                    response = await updateOrder(id, body);
                } else if (type === 'products' && id) {
                    response = await updateProduct(id, body);
                } else if (type === 'categories' && id) {
                    response = await updateCategory(id, body);
                } else if (type === 'content' && id) {
                    response = await updateContent(id, body);
                } else if (type === 'settings') {
                    response = await updateSettings(body);
                } else if (type === 'profile') {
                    response = await updateAdminProfile(body);
                }
                break;

            case 'PATCH':
                if (type === 'users' && id && action === 'ban') {
                    response = await banUser(id);
                } else if (type === 'users' && id && action === 'unban') {
                    response = await unbanUser(id);
                } else if (type === 'orders' && id && action === 'status') {
                    response = await updateOrderStatus(id, body.status);
                } else if (type === 'products' && id && action === 'stock') {
                    response = await updateProductStock(id, body.stock);
                } else if (type === 'content' && id && action === 'publish') {
                    response = await publishContent(id);
                } else if (type === 'content' && id && action === 'unpublish') {
                    response = await unpublishContent(id);
                } else if (type === 'notifications' && id && action === 'read') {
                    response = await markNotificationAsRead(id);
                } else if (type === 'password') {
                    response = await changeAdminPassword(body);
                }
                break;

            case 'DELETE':
                if (type === 'users' && id) {
                    response = await deleteUser(id);
                } else if (type === 'orders' && id) {
                    response = await deleteOrder(id);
                } else if (type === 'products' && id) {
                    response = await deleteProduct(id);
                } else if (type === 'categories' && id) {
                    response = await deleteCategory(id);
                } else if (type === 'content' && id) {
                    response = await deleteContent(id);
                } else if (type === 'notifications' && id) {
                    response = await deleteNotification(id);
                } else if (type === 'logs') {
                    response = await clearSystemLogs();
                }
                break;

            default:
                res.status(405).json({ error: 'Method not allowed' });
                return;
        }

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Admin Service Error:', error);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || error.message
        });
    }
}