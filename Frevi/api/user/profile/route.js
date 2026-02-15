import { connectDB } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { syncUser, WithAPI } from '@/api/users';

export async function GET(request) {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        return new Response(JSON.stringify({ error: 'Token is missing' }), { status: 401 });
    }

    try {
        const decoded = verifyJWT(token);
        const db = await connectDB();

        // Отримання даних користувача з бази
        const userSnapshot = await db.collection('users').where('email', '==', decoded.email).get();

        if (userSnapshot.empty) {
            return new Response(JSON.stringify({ error: 'User  not found' }), { status: 404 });
        }

        const user = userSnapshot.docs[0].data();
        const { password, ...userData } = user;

        // Викликаємо сервіс для синхронізації з User Service
        try {
            await syncUser, WithAPI(userData, token);
        } catch {
            // Помилка вже залогована у syncUser WithAPI, можна ігнорувати або обробити додатково
        }

        return new Response(JSON.stringify(userData), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
}