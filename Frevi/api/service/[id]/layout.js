import { getServiceById } from '@/lib/firebase/services';

const API_BASE_URL = 'http://localhost:9191/api';

export async function generateMetadata({ params }) {
    // Отримуємо з Firebase
    const service = await getServiceById(params.id);

    // Додатково отримуємо з Service Service
    const serviceResponse = await fetch(`${API_BASE_URL}/services/${params.id}`);
    const serviceFromAPI = await serviceResponse.json();

    const combinedService = { ...service, ...serviceFromAPI };

    return {
        title: `${combinedService.title} | Frevi Services`,
        description: combinedService.description?.substring(0, 160),
        openGraph: { images: combinedService.images?.[0] || '/default-service.jpg' },
    };
}

export default function Layout({ children }) {
    return <>{children}</>;
}