// import { signJWT } from '@/lib/auth';
// import { connectDB } from '@/lib/db';
//
// const API_BASE_URL = 'http://localhost:9191/api';
//
// export async function POST(request) {
//     const { email, password } = await request.json();
//     const db = await connectDB();
//
//     const userSnapshot = await db.collection('users').where('email', '==', email).get();
//
//     if (userSnapshot.empty) {
//         return new Response(JSON.stringify({ error: 'User not found' }), { status: 401 });
//     }
//
//     const user = userSnapshot.docs[0].data();
//
//     if (user.password !== password) {
//         return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
//     }
//
//     const token = signJWT({ id: user.id, email: user.email });
//
//     // Додаткова синхронізація з User Service
//     await fetch(`${API_BASE_URL}/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//     });
//
//     return new Response(JSON.stringify({ token }), { status: 200 });
// }
// api/route.js
import { signJWT } from '@/lib/auth';
import { connectDB } from '@/lib/db';

const API_BASE_URL = 'http://localhost:9191/api';

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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    async get(url, headers = {}) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
};

export async function POST(request) {
    const { email, password, action } = await request.json();

    try {
        const db = await connectDB();

        // Обробка різних дій
        if (action === 'login') {
            return await handleLogin(email, password, db);
        } else if (action === 'register') {
            return await handleRegister(email, password, db);
        } else if (action === 'logout') {
            return await handleLogout(email, db);
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

    } catch (error) {
        console.error('Auth error:', error);
        return new Response(JSON.stringify({
            error: 'Authentication failed',
            details: error.message
        }), { status: 500 });
    }
}

async function handleLogin(email, password, db) {
    // Перевірка в локальній базі
    const userSnapshot = await db.collection('users').where('email', '==', email).get();

    if (userSnapshot.empty) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 401 });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    // Перевірка пароля (в реальному додатку використовуйте bcrypt!)
    if (user.password !== password) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
    }

    try {
        // Синхронізація з основним сервісом
        const authResponse = await apiClient.post('/auth/login', {
            email,
            password,
            userId
        });

        // Оновлення часу останнього входу
        await db.collection('users').doc(userId).update({
            lastLogin: new Date().toISOString(),
            loginCount: (user.loginCount || 0) + 1
        });

        // Отримання додаткової інформації з основного сервісу
        let userProfile = {};
        try {
            userProfile = await apiClient.get(`/users/${userId}/profile`);
        } catch (profileError) {
            console.warn('Failed to fetch user profile:', profileError);
        }

        // Генерація JWT токена
        const token = signJWT({
            id: userId,
            email: user.email,
            name: user.name,
            roles: user.roles || ['user']
        });

        return new Response(JSON.stringify({
            token,
            user: {
                id: userId,
                email: user.email,
                name: user.name,
                ...userProfile
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (apiError) {
        console.error('API sync error:', apiError);
        // Fallback: генерація токена без синхронізації
        const token = signJWT({
            id: userId,
            email: user.email
        });

        return new Response(JSON.stringify({
            token,
            user: {
                id: userId,
                email: user.email,
                name: user.name
            },
            warning: 'Limited functionality due to service unavailability'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleRegister(email, password, db) {
    // Перевірка чи існує користувач
    const existingUser = await db.collection('users').where('email', '==', email).get();

    if (!existingUser.empty) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
    }

    try {
        // Створення користувача в основному сервісі
        const userData = {
            email,
            password,
            name: email.split('@')[0], // Default name
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const apiResponse = await apiClient.post('/auth/register', userData);
        const userId = apiResponse.userId;

        // Збереження в локальну базу
        await db.collection('users').doc(userId).set({
            ...userData,
            id: userId,
            password: password // У реальному додатку хешуйте пароль!
        });

        // Створення профілю
        try {
            await apiClient.post('/users/profile', {
                userId,
                email,
                name: userData.name,
                preferences: {}
            });
        } catch (profileError) {
            console.warn('Failed to create profile:', profileError);
        }

        // Генерація токена
        const token = signJWT({
            id: userId,
            email: email
        });

        return new Response(JSON.stringify({
            token,
            user: {
                id: userId,
                email: email,
                name: userData.name
            }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (apiError) {
        console.error('Registration API error:', apiError);
        return new Response(JSON.stringify({
            error: 'Registration failed',
            details: apiError.message
        }), { status: 500 });
    }
}

async function handleLogout(email, db) {
    try {
        // Знаходження користувача
        const userSnapshot = await db.collection('users').where('email', '==', email).get();

        if (userSnapshot.empty) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 401 });
        }

        const userId = userSnapshot.docs[0].id;

        // Виклик logout в основному сервісі
        try {
            await apiClient.post('/auth/logout', { userId });
        } catch (logoutError) {
            console.warn('Logout API error:', logoutError);
        }

        // Оновлення локальної бази
        await db.collection('users').doc(userId).update({
            lastLogout: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            message: 'Logged out successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Logout error:', error);
        return new Response(JSON.stringify({
            error: 'Logout failed'
        }), { status: 500 });
    }
}

// Health check endpoint
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        if (action === 'health') {
            // Перевірка зв'язку з основним сервісом
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
                    mainService: 'unavailable',
                    error: healthError.message
                }), { status: 200 });
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Health check failed' }), { status: 500 });
    }
}