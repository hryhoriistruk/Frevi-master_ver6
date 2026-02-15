// import { getServiceById } from '@/lib/firebase/services';
// import { fetchServiceById } from '@/api/services'; // Імпорт функції з API-сервісу
// import ServiceDetails from '@/components/services/ServiceDetails';
// import ClientBookingForm from '@/components/services/ClientBookingForm';
// export default async function ServicePage({ params }) {
//     // Отримуємо з Firebase
//     const service = await getServiceById(params.id);
//     // Отримуємо з API Gateway через сервіс
//     const serviceFromAPI = await fetchServiceById(params.id);
//     // Об'єднуємо дані
//     const combinedService = { ...service, ...serviceFromAPI };
//     return (
//         <div className="container py-8">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 <div className="lg:col-span-2">
//                     <ServiceDetails service={combinedService} />
//                 </div>
//                 <div className="lg:col-span-1">
//                     <ClientBookingForm serviceId={combinedService.id} price={combinedService.price} />
//                 </div>
//             </div>
//         </div>
//     );
// }
import { getServiceById } from '@/lib/firebase/services';
import { fetchServiceById } from '@/api/services'; // Імпорт функції з API-сервісу
import ServiceDetails from '@/components/services/ServiceDetails';
import ClientBookingForm from '@/components/services/ClientBookingForm';

export default async function ServicePage({ params }) {
    // Отримуємо з Firebase
    const service = await getServiceById(params.id);

    // Отримуємо з API Gateway через сервіс
    const serviceFromAPI = await fetchServiceById(params.id);

    // Об'єднуємо дані
    const combinedService = { ...service, ...serviceFromAPI };

    return (
        <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ServiceDetails service={combinedService} />
                </div>
                <div className="lg:col-span-1">
                    <ClientBookingForm serviceId={combinedService.id} price={combinedService.price} />
                </div>
            </div>
        </div>
    );
}