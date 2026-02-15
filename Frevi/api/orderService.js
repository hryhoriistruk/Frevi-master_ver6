import axios from 'axios';

const orderService = axios.create({
    baseURL: 'http://localhost:9191/api/v1/orders', // Оновлений URL через API Gateway
});

export const getOrders = (params = {}) => orderService.get('', { params });
export const getOrderById = (id) => orderService.get(`/${id}`);
export const createOrder = (data) => orderService.post('/', data);
export const updateOrder = (data) => orderService.put('', data);
export const deleteOrder = (id) => orderService.delete(`/${id}`);
export const cancelOrder = (id) => orderService.patch(`/${id}/cancel`);
// Note: getUserOrders and getSellerOrders might need to be implemented in the backend
export const getUserOrders = (userId) => orderService.get('', { params: { userId } });
export const getSellerOrders = (sellerId) => orderService.get('', { params: { sellerId } });