import axios from "axios";

const friendsService = axios.create({
    baseURL: 'http://localhost:9191/api/friends',
});
friendsService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Обробка помилок
friendsService.interceptors.response.use(
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

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { fromUserId, toUserId, message } = req.body;

        try {
            const response = await friendsService.post('/requests', {
                fromUserId,
                toUserId,
                message
            });

            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const sendFriendRequest = (requestData) => friendsService.post('/requests', requestData);
export const getFriendRequests = (userId) => friendsService.get(`/requests/${userId}`);
export const acceptFriendRequest = (requestId) => friendsService.patch(`/requests/${requestId}/accept`);
export const rejectFriendRequest = (requestId) => friendsService.patch(`/requests/${requestId}/reject`);
export const getFriendsList = (userId) => friendsService.get(`/${userId}`);
export const removeFriend = (friendshipId) => friendsService.delete(`/${friendshipId}`);
export const checkFriendship = (userId1, userId2) => friendsService.get(`/status/${userId1}/${userId2}`);
