// import { OAuth2Client } from 'google-auth-library';
// import { signJWT } from '@/lib/auth';
// import { connectDB } from '@/lib/db';
//
// const API_BASE_URL = 'http://localhost:9191/api';
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//
// export async function POST(request) {
//     const { token } = await request.json();
//
//     try {
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });
//
//         const payload = ticket.getPayload();
//         const db = await connectDB();
//
//         let user = await db.collection('users').where('email', '==', payload.email).get();
//
//         if (user.empty) {
//             const newUser = {
//                 email: payload.email,
//                 name: payload.name,
//                 createdAt: new Date().toISOString(),
//             };
//             await db.collection('users').add(newUser);
//
//             await fetch(`${API_BASE_URL}/users`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(newUser),
//             });
//         }
//
//         const jwtToken = signJWT({ email: payload.email });
//         return new Response(JSON.stringify({ token: jwtToken }), { status: 200 });
//     } catch (error) {
//         return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401 });
//     }
// }

// api/route.js
import { OAuth2Client } from 'google-auth-library';
import { signJWT } from '@/lib/auth';
import { connectDB } from '@/lib/db';

const API_BASE_URL = 'http://localhost:9191/api';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// API client для комунікації з портом 9191
const apiClient = {
    async post(url, data, headers = {}) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    async get(url, headers = {}) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        });
        return response.json();
    }
};

export async function POST(request) {
    const { token, provider = 'google' } = await request.json();

    try {
        let userPayload;

        // Обробка різних провайдерів аутентифікації
        if (provider === 'google') {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            userPayload = ticket.getPayload();
        } else {
            // Тут можна додати інші провайдери (facebook, github, etc.)
            throw new Error('Unsupported authentication provider');
        }

        const db = await connectDB();

        // Перевірка чи існує користувач в локальній базі
        let user = await db.collection('users').where('email', '==', userPayload.email).get();

        if (user.empty) {
            // Створення нового користувача
            const newUser = {
                email: userPayload.email,
                name: userPayload.name,
                picture: userPayload.picture,
                provider: provider,
                emailVerified: userPayload.email_verified || false,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                status: 'active'
            };

            // Збереження в локальну базу
            const userRef = await db.collection('users').add(newUser);
            newUser.id = userRef.id;

            // Синхронізація з основним сервісом на порті 9191
            try {
                await apiClient.post('/auth/register', {
                    ...newUser,
                    externalId: userPayload.sub,
                    provider: provider
                });
            } catch (syncError) {
                console.warn('Failed to sync user with main service:', syncError);
                // Продовжуємо навіть якщо синхронізація не вдалася
            }

            // Створення профілю користувача
            try {
                await apiClient.post('/users/profile', {
                    userId: userRef.id,
                    email: newUser.email,
                    name: newUser.name,
                    avatar: newUser.picture,
                    preferences: {}
                });
            } catch (profileError) {
                console.warn('Failed to create user profile:', profileError);
            }

            user = { docs: [{ id: userRef.id, data: () => newUser }] };
        } else {
            // Оновлення часу останнього входу для існуючого користувача
            const userData = user.docs[0].data();
            await db.collection('users').doc(user.docs[0].id).update({
                lastLogin: new Date().toISOString(),
                picture: userPayload.picture || userData.picture
            });

            // Синхронізація активності з основним сервісом
            try {
                await apiClient.post('/auth/activity', {
                    userId: user.docs[0].id,
                    action: 'login',
                    timestamp: new Date().toISOString()
                });
            } catch (activityError) {
                console.warn('Failed to sync activity:', activityError);
            }
        }

        const userData = user.docs[0].data();
        const userId = user.docs[0].id;

        // Генерація JWT токена
        const jwtToken = signJWT({
            userId: userId,
            email: userData.email,
            name: userData.name
        });

        // Отримання додаткових даних з основного сервісу
        let userProfile = {};
        try {
            userProfile = await apiClient.get(`/users/${userId}/profile`);
        } catch (profileError) {
            console.warn('Failed to fetch user profile from main service:', profileError);
        }

        // Перевірка прав доступу та ролей
        let userRoles = ['user'];
        try {
            const rolesResponse = await apiClient.get(`/users/${userId}/roles`);
            userRoles = rolesResponse.roles || ['user'];
        } catch (rolesError) {
            console.warn('Failed to fetch user roles:', rolesError);
        }

        return new Response(JSON.stringify({
            token: jwtToken,
            user: {
                id: userId,
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
                roles: userRoles,
                ...userProfile
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error('Authentication error:', error);

        return new Response(JSON.stringify({
            error: 'Authentication failed',
            details: error.message
        }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
}

// Додаткові методи для обробки інших HTTP методів
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        if (action === 'health') {
            // Health check для перевірки зв'язку з сервісом 9191
            try {
                const healthResponse = await apiClient.get('/health');
                return new Response(JSON.stringify({
                    status: 'healthy',
                    service: 'auth-service',
                    mainService: healthResponse
                }), { status: 200 });
            } catch (healthError) {
                return new Response(JSON.stringify({
                    status: 'degraded',
                    service: 'auth-service',
                    mainService: 'unavailable'
                }), { status: 200 });
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Request failed' }), { status: 500 });
    }
}

// Опціонально: обробка інших методів
export async function PUT(request) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

export async function DELETE(request) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

export async function PATCH(request) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}