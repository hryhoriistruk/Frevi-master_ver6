import { getServices } from '@/lib/firebase/services';
import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:9191/api';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const userId = searchParams.get('userId');
        const limit = searchParams.get('limit');
        const page = searchParams.get('page');

        let services = [];

        // Спочатку намагаємося отримати з API Gateway
        try {
            const queryParams = new URLSearchParams();
            if (category) queryParams.append('category', category);
            if (userId) queryParams.append('userId', userId);
            if (limit) queryParams.append('limit', limit);
            if (page) queryParams.append('page', page);

            const queryString = queryParams.toString();
            const apiUrl = `${API_BASE_URL}/services${queryString ? `?${queryString}` : ''}`;

            const servicesResponse = await fetch(apiUrl, {
                headers: { 'Content-Type': 'application/json' },
                next: { revalidate: 60 } // Revalidate every 60 seconds
            });

            if (servicesResponse.ok) {
                services = await servicesResponse.json();
                console.log('Services from API Gateway');
            } else {
                throw new Error(`API returned ${servicesResponse.status}`);
            }
        } catch (apiError) {
            // Fallback до Firebase якщо API не доступний
            console.warn('Services API unavailable, using Firebase fallback:', apiError);
            services = await getServices({ category, userId });
            console.log('Services from Firebase');
        }

        return NextResponse.json(services);

    } catch (error) {
        console.error('Error in services endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to fetch services', message: error.message },
            { status: 500 }
        );
    }
}