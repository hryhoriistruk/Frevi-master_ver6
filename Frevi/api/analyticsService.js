import axios from 'axios';

const analyticsService = axios.create({
    baseURL: 'http://localhost:9191/api/analytics',
});

// Default headers configuration
analyticsService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('analyticsToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

export const AnalyticsService = {
    // Аналітика замовлень
    getOrderAnalytics: async (filters = {}, token) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await analyticsService.get(`/orders${queryParams ? `?${queryParams}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching order analytics:', error);
            throw error;
        }
    },

    // Аналітика статусів замовлень
    getOrderStatusAnalytics: async (period, token) => {
        try {
            const response = await analyticsService.get(`/orders/status?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching order status analytics:', error);
            throw error;
        }
    },

    // Аналітика інцидентів
    getIncidentAnalytics: async (filters = {}, token) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await analyticsService.get(`/incidents${queryParams ? `?${queryParams}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching incident analytics:', error);
            throw error;
        }
    },

    // Фінансова аналітика
    getFinancialAnalytics: async (period, token) => {
        try {
            const response = await analyticsService.get(`/financial?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching financial analytics:', error);
            throw error;
        }
    },

    // Аналітика повідомлень
    getMessageAnalytics: async (filters = {}, token) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await analyticsService.get(`/messages${queryParams ? `?${queryParams}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching message analytics:', error);
            throw error;
        }
    },

    // Загальна платформна аналітика
    getPlatformAnalytics: async (period, token) => {
        try {
            const response = await analyticsService.get(`/platform?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching platform analytics:', error);
            throw error;
        }
    },

    // Аналітика по користувачах
    getUserAnalytics: async (filters = {}, token) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await analyticsService.get(`/users${queryParams ? `?${queryParams}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user analytics:', error);
            throw error;
        }
    },

    // Отримати реальний час аналітики
    getRealtimeAnalytics: async (token) => {
        try {
            const response = await analyticsService.get('/realtime', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching realtime analytics:', error);
            throw error;
        }
    },

    // Генерувати звіт
    generateReport: async (reportType, parameters, token) => {
        try {
            const response = await analyticsService.post('/reports', {
                reportType,
                parameters
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }
};
export const getOrderAnalytics = (params = {}) => analyticsService.get('/orders', { params });
export const getOrderStatusAnalytics = (period) =>
    analyticsService.get('/orders/status', { params: { period } });

// Incidents Analytics
export const getIncidentAnalytics = (params = {}) => analyticsService.get('/incidents', { params });
export const createIncidentAnalytics = (incidentData) => analyticsService.post('/incidents', incidentData);
export const updateIncidentAnalytics = (id, data) => analyticsService.put(`/incidents/${id}`, data);
export const deleteIncidentAnalytics = (id) => analyticsService.delete(`/incidents/${id}`);

// Financial Analytics
export const getFinancialAnalytics = (period) =>
    analyticsService.get('/financial', { params: { period } });
export const createFinancialRecord = (recordData) => analyticsService.post('/financial', recordData);
export const updateFinancialRecord = (id, data) => analyticsService.put(`/financial/${id}`, data);
export const deleteFinancialRecord = (id) => analyticsService.delete(`/financial/${id}`);

// Messages Analytics
export const getMessageAnalytics = (params = {}) => analyticsService.get('/messages', { params });
export const createMessageRecord = (messageData) => analyticsService.post('/messages', messageData);
export const updateMessageRecord = (id, data) => analyticsService.put(`/messages/${id}`, data);
export const deleteMessageRecord = (id) => analyticsService.delete(`/messages/${id}`);

// Platform Analytics
export const getPlatformAnalytics = (period) =>
    analyticsService.get('/platform', { params: { period } });

// Users Analytics
export const getUserAnalytics = (params = {}) => analyticsService.get('/users', { params });
export const createUserAnalytics = (userData) => analyticsService.post('/users', userData);
export const updateUserAnalytics = (id, data) => analyticsService.put(`/users/${id}`, data);
export const deleteUserAnalytics = (id) => analyticsService.delete(`/users/${id}`);

// Realtime Analytics
export const getRealtimeAnalytics = () => analyticsService.get('/realtime');

// Reports
export const generateReport = (reportType, parameters) =>
    analyticsService.post('/reports', { reportType, parameters });
export const updateReport = (id, data) => analyticsService.put(`/reports/${id}`, data);
export const deleteReport = (id) => analyticsService.delete(`/reports/${id}`);

export default analyticsService;