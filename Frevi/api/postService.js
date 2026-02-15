// import { storage } from '../../../firebase/init';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import axios from "axios";
//
// const postService = axios.create({
//     baseURL: 'http://localhost:9191/api/posts',
// });
//
// export default async function handler(req, res) {
//     if (req.method === 'POST') {
//         const { userId, text, imageFile } = req.body;
//
//         try {
//             // Завантаження фото в Firebase Storage
//             const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${imageFile.name}`);
//             await uploadBytes(storageRef, imageFile);
//             const imageUrl = await getDownloadURL(storageRef);
//
//             // Відправка даних до Post Service
//             const response = await postService.post('/', {
//                 userId,
//                 text,
//                 imageUrl,
//                 createdAt: new Date().toISOString()
//             });
//
//             res.status(200).json(response.data);
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }
// }
//
// export const createPost = (postData) => postService.post('/', postData);
// export const getUserPosts = (userId) => postService.get(`/user/${userId}`);
// export const getFeedPosts = () => postService.get('/feed');
// export const likePost = (postId) => postService.patch(`/${postId}/like`);
// export const commentPost = (postId, comment) => postService.post(`/${postId}/comments`, { comment });
// export const deletePost = (postId) => postService.delete(`/${postId}`);
// export const getPostById = (postId) => postService.get(`/${postId}`);

// api/postService.js
import axios from "axios";
import { storage } from '../../../firebase/init';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const postService = axios.create({
    baseURL: 'http://localhost:9191/api/v1/posts',
});

// Default headers configuration
postService.interceptors.request.use((config) => {
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

// Upload image to Firebase Storage
export const uploadPostImage = async (file, userId) => {
    try {
        const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// Posts
export const createPost = async (postData) => {
    // If there's a file, upload it first
    if (postData.imageFile) {
        const imageUrl = await uploadPostImage(postData.imageFile, postData.userId);
        postData.imageUrl = imageUrl;
        delete postData.imageFile;
    }

    return postService.post('/', postData);
};

export const getUserPosts = (userId, params = {}) =>
    postService.get(`/user/${userId}`, { params });

export const getFeedPosts = (params = {}) => postService.get('', { params });
// Note: likePost and commentPost might need to be implemented in the backend
export const likePost = (postId) => postService.patch(`/${postId}/like`);
export const commentPost = (postId, comment) => postService.post(`/${postId}/comments`, { comment });
export const deletePost = (postId) => postService.delete(`/${postId}`);
export const getPostById = (postId) => postService.get(`/${postId}`);

// API route handler for Next.js
export default async function handler(req, res) {
    const { method, query, body } = req;
    const { postId, userId, action } = query;

    try {
        let response;

        switch (method) {
            case 'GET':
                if (userId) {
                    response = await getUserPosts(userId, query);
                } else if (postId) {
                    response = await getPostById(postId);
                } else {
                    response = await getFeedPosts(query);
                }
                break;

            case 'POST':
                if (action === 'comment' && postId) {
                    response = await commentPost(postId, body.comment);
                } else {
                    response = await createPost(body);
                }
                break;

            case 'PATCH':
                if (postId && action === 'like') {
                    response = await likePost(postId);
                }
                break;

            case 'DELETE':
                if (postId) {
                    response = await deletePost(postId);
                }
                break;

            default:
                res.status(405).json({ error: 'Method not allowed' });
                return;
        }

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Post Service Error:', error);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || error.message
        });
    }
}