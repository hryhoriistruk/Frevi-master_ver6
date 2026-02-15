// import { db } from '../../../firebase/init';
// import { addDoc, collection } from 'firebase/firestore';
// import axios from "axios";
//
// const assistanceService = axios.create({
//     baseURL: 'http://localhost:9191/api/assistance',
// });
//
// export default async function handler(req, res) {
//     if (req.method === 'POST') {
//         const { userId, message } = req.body;
//         await addDoc(collection(db, 'helpRequests'), { userId, message });
//
//         // Додатково відправляємо до Assistance Service
//         await assistanceService.post('/help-requests', { userId, message });
//
//         res.status(200).json({ success: true });
//     } else {
//         res.status(405).end();
//     }
// }
//
// export const createHelpRequest = (data) => assistanceService.post('/help-requests', data);
// export const getHelpRequests = (userId) => assistanceService.get(`/help-requests?userId=${userId}`);

// api/send.js - Assistance Service для послуг та фільтрації
import axios from "axios";

const assistanceService = axios.create({
    baseURL: 'http://localhost:9191/api/assistance',
});

// Default headers configuration
assistanceService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (userId) {
        config.headers['x-user-id'] = userId;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Services - Послуги
export const getAllServices = (params = {}) => assistanceService.get('/services', { params });
export const getServiceById = (id) => assistanceService.get(`/services/${id}`);
export const createService = (serviceData) => assistanceService.post('/services', serviceData);
export const updateService = (id, data) => assistanceService.put(`/services/${id}`, data);
export const deleteService = (id) => assistanceService.delete(`/services/${id}`);
export const getUserServices = (userId, params = {}) =>
    assistanceService.get(`/users/${userId}/services`, { params });
export const searchServices = (query, params = {}) =>
    assistanceService.get('/services/search', { params: { q: query, ...params } });

// Service Categories - Категорії послуг
export const getAllCategories = () => assistanceService.get('/categories');
export const getCategoryById = (id) => assistanceService.get(`/categories/${id}`);
export const createCategory = (categoryData) => assistanceService.post('/categories', categoryData);
export const updateCategory = (id, data) => assistanceService.put(`/categories/${id}`, data);
export const deleteCategory = (id) => assistanceService.delete(`/categories/${id}`);

// Service Filters - Фільтрація послуг
export const filterServices = (filters = {}) =>
    assistanceService.get('/services/filter', { params: filters });

export const getServicesByCategory = (categoryId, params = {}) =>
    assistanceService.get(`/categories/${categoryId}/services`, { params });

export const getServicesByLocation = (location, params = {}) =>
    assistanceService.get('/services/location', { params: { location, ...params } });

export const getServicesByPriceRange = (minPrice, maxPrice, params = {}) =>
    assistanceService.get('/services/price-range', { params: { minPrice, maxPrice, ...params } });

export const getServicesByRating = (minRating, params = {}) =>
    assistanceService.get('/services/rating', { params: { minRating, ...params } });

// Service Reviews - Відгуки про послуги
export const getServiceReviews = (serviceId, params = {}) =>
    assistanceService.get(`/services/${serviceId}/reviews`, { params });

export const createServiceReview = (serviceId, reviewData) =>
    assistanceService.post(`/services/${serviceId}/reviews`, reviewData);

export const updateServiceReview = (serviceId, reviewId, data) =>
    assistanceService.put(`/services/${serviceId}/reviews/${reviewId}`, data);

export const deleteServiceReview = (serviceId, reviewId) =>
    assistanceService.delete(`/services/${serviceId}/reviews/${reviewId}`);

// Service Bookings - Бронювання послуг
export const bookService = (serviceId, bookingData) =>
    assistanceService.post(`/services/${serviceId}/bookings`, bookingData);

export const getUserBookings = (userId, params = {}) =>
    assistanceService.get(`/users/${userId}/bookings`, { params });

export const getServiceBookings = (serviceId, params = {}) =>
    assistanceService.get(`/services/${serviceId}/bookings`, { params });

export const updateBookingStatus = (bookingId, status) =>
    assistanceService.patch(`/bookings/${bookingId}/status`, { status });

export const cancelBooking = (bookingId) =>
    assistanceService.delete(`/bookings/${bookingId}`);

// Service Favorites - Улюблені послуги
export const getUserFavorites = (userId) =>
    assistanceService.get(`/users/${userId}/favorites`);

export const addToFavorites = (userId, serviceId) =>
    assistanceService.post(`/users/${userId}/favorites`, { serviceId });

export const removeFromFavorites = (userId, serviceId) =>
    assistanceService.delete(`/users/${userId}/favorites/${serviceId}`);

// Service Statistics - Статистика послуг
export const getServiceStats = (serviceId) =>
    assistanceService.get(`/services/${serviceId}/stats`);

export const getUserServiceStats = (userId) =>
    assistanceService.get(`/users/${userId}/service-stats`);

export const getPopularServices = (limit = 10) =>
    assistanceService.get('/services/popular', { params: { limit } });

export const getTrendingServices = (limit = 10) =>
    assistanceService.get('/services/trending', { params: { limit } });

// API route handler for Next.js
export default async function handler(req, res) {
    const { method, query, body, headers } = req;
    const { id, userId, serviceId, categoryId, action, type } = query;

    try {
        // Verify authentication
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token && method !== 'GET') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        let response;

        switch (method) {
            case 'GET':
                if (type === 'services' && id) {
                    response = await getServiceById(id);
                } else if (type === 'services' && categoryId) {
                    response = await getServicesByCategory(categoryId, query);
                } else if (type === 'services' && action === 'search') {
                    response = await searchServices(query.q, query);
                } else if (type === 'services' && action === 'filter') {
                    response = await filterServices(query);
                } else if (type === 'services' && action === 'popular') {
                    response = await getPopularServices(query.limit);
                } else if (type === 'services' && action === 'trending') {
                    response = await getTrendingServices(query.limit);
                } else if (type === 'services') {
                    response = await getAllServices(query);
                } else if (type === 'categories' && id) {
                    response = await getCategoryById(id);
                } else if (type === 'categories') {
                    response = await getAllCategories();
                } else if (type === 'user-services' && userId) {
                    response = await getUserServices(userId, query);
                } else if (type === 'reviews' && serviceId) {
                    response = await getServiceReviews(serviceId, query);
                } else if (type === 'bookings' && userId) {
                    response = await getUserBookings(userId, query);
                } else if (type === 'favorites' && userId) {
                    response = await getUserFavorites(userId);
                } else if (type === 'stats' && serviceId) {
                    response = await getServiceStats(serviceId);
                }
                break;

            case 'POST':
                if (type === 'services') {
                    response = await createService(body);
                } else if (type === 'categories') {
                    response = await createCategory(body);
                } else if (type === 'reviews' && serviceId) {
                    response = await createServiceReview(serviceId, body);
                } else if (type === 'bookings' && serviceId) {
                    response = await bookService(serviceId, body);
                } else if (type === 'favorites' && userId) {
                    response = await addToFavorites(userId, body.serviceId);
                }
                break;

            case 'PUT':
                if (type === 'services' && id) {
                    response = await updateService(id, body);
                } else if (type === 'categories' && id) {
                    response = await updateCategory(id, body);
                } else if (type === 'reviews' && serviceId && id) {
                    response = await updateServiceReview(serviceId, id, body);
                }
                break;

            case 'PATCH':
                if (type === 'bookings' && id && action === 'status') {
                    response = await updateBookingStatus(id, body.status);
                }
                break;

            case 'DELETE':
                if (type === 'services' && id) {
                    response = await deleteService(id);
                } else if (type === 'categories' && id) {
                    response = await deleteCategory(id);
                } else if (type === 'reviews' && serviceId && id) {
                    response = await deleteServiceReview(serviceId, id);
                } else if (type === 'bookings' && id) {
                    response = await cancelBooking(id);
                } else if (type === 'favorites' && userId && id) {
                    response = await removeFromFavorites(userId, id);
                }
                break;

            default:
                res.status(405).json({ error: 'Method not allowed' });
                return;
        }

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Assistance Service Error:', error);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || error.message
        });
    }
}