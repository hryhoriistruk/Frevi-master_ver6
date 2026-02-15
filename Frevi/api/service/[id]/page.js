// // app/service/[id]/page.js
// 'use client';
//
// import { useState, useEffect } from 'react';
// import ServiceDetails from '@/components/services/ServiceDetails';
// import ClientBookingForm from '@/components/services/ClientBookingForm';
//
// const API_BASE_URL = 'http://localhost:9191/api'; // API Gateway URL
//
// async function getServiceById(serviceId) {
//     try {
//         const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             cache: 'force-cache' // Optional: for better performance
//         });
//
//         if (!response.ok) {
//             throw new Error('Service not found');
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching service:', error);
//         throw error;
//     }
// }
//
// export default function ServicePage({ params }) {
//     const [service, setService] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         const fetchService = async () => {
//             try {
//                 setLoading(true);
//                 const serviceData = await getServiceById(params.id);
//                 setService(serviceData);
//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchService();
//     }, [params.id]);
//
//     if (loading) {
//         return (
//             <div className="container py-8">
//                 <div className="flex justify-center items-center h-64">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//                 </div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="container py-8">
//                 <div className="text-center text-red-500">
//                     <h2 className="text-2xl font-bold">Error</h2>
//                     <p>{error}</p>
//                 </div>
//             </div>
//         );
//     }
//
//     if (!service) {
//         return (
//             <div className="container py-8">
//                 <div className="text-center">
//                     <h2 className="text-2xl font-bold">Service not found</h2>
//                 </div>
//             </div>
//         );
//     }
//
//     return (
//         <div className="container py-8">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 <div className="lg:col-span-2">
//                     <ServiceDetails service={service} />
//                 </div>
//                 <div className="lg:col-span-1">
//                     <ClientBookingForm
//                         serviceId={service.id}
//                         price={service.price}
//                         serviceTitle={service.title}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// }
// app/service/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import ServiceDetails from '@/components/services/ServiceDetails';
import ClientBookingForm from '@/components/services/ClientBookingForm';
import { getServiceById } from '@/api/services'; // Імпортуємо з нового файлу

export default function ServicePage({ params }) {
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                // Використовуємо функцію з api/services.js
                const serviceData = await getServiceById(params.id);
                setService(serviceData.data); // axios повертає дані в об'єкті .data
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [params.id]);

    if (loading) {
        return (
            <div className="container py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8">
                <div className="text-center text-red-500">
                    <h2 className="text-2xl font-bold">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="container py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Service not found</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ServiceDetails service={service} />
                </div>
                <div className="lg:col-span-1">
                    <ClientBookingForm
                        serviceId={service.id}
                        price={service.price}
                        serviceTitle={service.title}
                    />
                </div>
            </div>
        </div>
    );
}