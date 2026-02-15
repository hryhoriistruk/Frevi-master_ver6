// import { hashPassword } from '@/lib/auth';
// import { connectDB } from '@/lib/db';
//
// const API_BASE_URL = 'http://localhost:9191/api';
//
// export async function POST(request) {
//     const { email, password, name } = await request.json();
//     const db = await connectDB();
//
//     const existingUser = await db.collection('users').where('email', '==', email).get();
//
//     if (!existingUser.empty) {
//         return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400 });
//     }
//
//     const hashedPassword = await hashPassword(password);
//
//     const newUser = {
//         email,
//         password: hashedPassword,
//         name,
//         createdAt: new Date().toISOString(),
//     };
//
//     await db.collection('users').add(newUser);
//
//     // Додаткова синхронізація з User Service
//     await fetch(`${API_BASE_URL}/users`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newUser),
//     });
//
//     return new Response(JSON.stringify({ success: true }), { status: 201 });
// }
// api/route.js
import { hashPassword, verifyPassword, signJWT } from '@/lib/auth';
import { connectDB } from '@/lib/db';

const API_BASE_URL = 'http://localhost:9191/api';

// API client для комунікації з портом 9191
const apiClient = {
    async request(url, options = {}) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    async post(url, data, headers = {}) {
        return this.request(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
    },

    async get(url, headers = {}) {
        return this.request(url, {
            method: 'GET',
            headers,
        });
    },

    async put(url, data, headers = {}) {
        return this.request(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
    }
};

export async function POST(request) {
    const { email, password, name, action } = await request.json();

    try {
        const db = await connectDB();

        if (action === 'register') {
            return await handleRegistration(email, password, name, db);
        } else if (action === 'login') {
            return await handleLogin(email, password, db);
        } else if (action === 'verify') {
            return await handleVerification(email, db);
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Registration error:', error);
        return new Response(JSON.stringify({
            error: 'Registration failed',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleRegistration(email, password, name, db) {
    // Валідація вхідних даних
    if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Перевірка формату email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Перевірка міцності пароля
    if (password.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Перевірка чи існує користувач
    const existingUser = await db.collection('users').where('email', '==', email).get();

    if (!existingUser.empty) {
        return new Response(JSON.stringify({ error: 'User already exists' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Хешування пароля
    const hashedPassword = await hashPassword(password);

    try {
        // Створення користувача в основному сервісі
        const userData = {
            email,
            password: hashedPassword,
            name: name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            emailVerified: false,
            role: 'user',
            preferences: {},
            profile: {
                displayName: name.trim(),
                avatar: null,
                bio: '',
                location: ''
            }
        };

        // Спочатку створюємо в основному сервісі
        const apiResponse = await apiClient.post('/users/register', userData);
        const userId = apiResponse.userId || apiResponse.id;

        // Потім зберігаємо в локальну базу
        await db.collection('users').doc(userId).set({
            ...userData,
            id: userId,
            localId: userId // Дублюємо ID для зручності
        });

        // Створення профілю в основному сервісі
        try {
            await apiClient.post('/profiles', {
                userId: userId,
                email: email,
                displayName: name.trim(),
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' ') || '',
                avatar: null,
                bio: '',
                location: '',
                website: '',
                socialLinks: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (profileError) {
            console.warn('Failed to create profile in main service:', profileError);
            // Продовжуємо навіть якщо профіль не створився
        }

        // Відправлення email для верифікації
        try {
            await apiClient.post('/auth/send-verification', {
                userId: userId,
                email: email
            });
        } catch (verificationError) {
            console.warn('Failed to send verification email:', verificationError);
        }

        // Генерація JWT токена для автоматичного логіну
        const token = signJWT({
            id: userId,
            email: email,
            name: name,
            role: 'user'
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: userId,
                email: email,
                name: name,
                token: token
            }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (apiError) {
        console.error('API registration error:', apiError);

        // Спроба відкату: видаляємо користувача з локальної бази, якщо створення в основному сервісі не вдалося
        try {
            const userToDelete = await db.collection('users').where('email', '==', email).get();
            if (!userToDelete.empty) {
                await db.collection('users').doc(userToDelete.docs[0].id).delete();
            }
        } catch (deleteError) {
            console.error('Failed to rollback user creation:', deleteError);
        }

        return new Response(JSON.stringify({
            error: 'Registration failed',
            details: apiError.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleLogin(email, password, db) {
    try {
        // Перевірка в локальній базі
        const userSnapshot = await db.collection('users').where('email', '==', email).get();

        if (userSnapshot.empty) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();
        const userId = userDoc.id;

        // Перевірка пароля
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Синхронізація з основним сервісом
        try {
            await apiClient.post('/auth/login', {
                userId: userId,
                email: email,
                timestamp: new Date().toISOString()
            });
        } catch (loginError) {
            console.warn('Failed to sync login with main service:', loginError);
        }

        // Оновлення часу останнього входу
        await db.collection('users').doc(userId).update({
            lastLogin: new Date().toISOString(),
            loginCount: (user.loginCount || 0) + 1
        });

        // Генерація токена
        const token = signJWT({
            id: userId,
            email: user.email,
            name: user.name,
            role: user.role || 'user'
        });

        return new Response(JSON.stringify({
            success: true,
            token: token,
            user: {
                id: userId,
                email: user.email,
                name: user.name,
                role: user.role || 'user'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ error: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleVerification(email, db) {
    try {
        const userSnapshot = await db.collection('users').where('email', '==', email).get();

        if (userSnapshot.empty) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userId = userSnapshot.docs[0].id;

        // Верифікація в основному сервісі
        await apiClient.post('/auth/verify-email', {
            userId: userId,
            email: email
        });

        // Оновлення статусу в локальній базі
        await db.collection('users').doc(userId).update({
            emailVerified: true,
            updatedAt: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Email verified successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Verification error:', error);
        return new Response(JSON.stringify({ error: 'Verification failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Health check endpoint
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'health') {
            // Перевірка зв'язку з основним сервісом
            try {
                const healthResponse = await apiClient.get('/health');
                return new Response(JSON.stringify({
                    status: 'healthy',
                    service: 'registration-service',
                    mainService: healthResponse
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (healthError) {
                return new Response(JSON.stringify({
                    status: 'degraded',
                    service: 'registration-service',
                    mainService: 'unavailable',
                    error: healthError.message
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Health check failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Додаткові методи
export async function PUT(request) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function DELETE(request) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}