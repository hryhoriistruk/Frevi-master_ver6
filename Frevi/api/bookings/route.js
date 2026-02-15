// import { createBooking, getUserBookings } from '@/lib/firebase/bookings';
// import { NextResponse } from 'next/server';
// import { getCurrentUser } from '@/lib/firebase/auth';
//
// const API_BASE_URL = 'http://localhost:9191/api';
//
// export async function POST(request) {
//     try {
//         const user = await getCurrentUser();
//         if (!user) {
//             return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//         }
//
//         const bookingData = await request.json();
//         const bookingId = await createBooking({ ...bookingData, userId: user.uid });
//
//         // Додаткова синхронізація з Order Service
//         await fetch(`${API_BASE_URL}/orders`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ ...bookingData, userId: user.uid })
//         });
//
//         return NextResponse.json({ bookingId });
//     } catch (error) {
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }
//
// export async function GET(request) {
//     try {
//         const user = await getCurrentUser();
//         if (!user) {
//             return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//         }
//
//         const bookings = await getUserBookings(user.uid);
//
//         // Додатково отримуємо з Order Service
//         const ordersResponse = await fetch(`${API_BASE_URL}/orders/user/${user.uid}`);
//         const orders = await ordersResponse.json();
//
//         return NextResponse.json([...bookings, ...orders]);
//     } catch (error) {
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }
// api/booking.js (повна інтеграція booking service)
import axios from "axios";

const API_BASE_URL = 'http://localhost:9191/api';

const bookingService = axios.create({
    baseURL: API_BASE_URL,
});

// Default headers configuration
bookingService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Bookings Management
export const getAllBookings = (params = {}) => bookingService.get('/bookings', { params });
export const getBookingById = (bookingId) => bookingService.get(`/bookings/${bookingId}`);
export const createBooking = (bookingData) => bookingService.post('/bookings', bookingData);
export const updateBooking = (bookingId, data) => bookingService.put(`/bookings/${bookingId}`, data);
export const deleteBooking = (bookingId) => bookingService.delete(`/bookings/${bookingId}`);
export const cancelBooking = (bookingId, reason = '') =>
    bookingService.patch(`/bookings/${bookingId}/cancel`, { reason });
export const confirmBooking = (bookingId) => bookingService.patch(`/bookings/${bookingId}/confirm`);
export const rescheduleBooking = (bookingId, newDateTime) =>
    bookingService.patch(`/bookings/${bookingId}/reschedule`, { dateTime: newDateTime });

// User Bookings
export const getUserBookings = (userId, params = {}) =>
    bookingService.get(`/bookings/user/${userId}`, { params });
export const getUserUpcomingBookings = (userId) =>
    bookingService.get(`/bookings/user/${userId}/upcoming`);
export const getUserPastBookings = (userId) =>
    bookingService.get(`/bookings/user/${userId}/past`);
export const getUserCancelledBookings = (userId) =>
    bookingService.get(`/bookings/user/${userId}/cancelled`);

// Service Provider Bookings
export const getProviderBookings = (providerId, params = {}) =>
    bookingService.get(`/bookings/provider/${providerId}`, { params });
export const getProviderSchedule = (providerId, date) =>
    bookingService.get(`/bookings/provider/${providerId}/schedule`, { params: { date } });
export const getProviderAvailability = (providerId, dateRange) =>
    bookingService.get(`/bookings/provider/${providerId}/availability`, { params: dateRange });
export const setProviderUnavailable = (providerId, timeSlot) =>
    bookingService.post(`/bookings/provider/${providerId}/unavailable`, timeSlot);
export const removeProviderUnavailable = (providerId, slotId) =>
    bookingService.delete(`/bookings/provider/${providerId}/unavailable/${slotId}`);

// Booking Status Management
export const updateBookingStatus = (bookingId, status) =>
    bookingService.patch(`/bookings/${bookingId}/status`, { status });
export const markBookingAsCompleted = (bookingId) =>
    bookingService.patch(`/bookings/${bookingId}/complete`);
export const markBookingAsNoShow = (bookingId) =>
    bookingService.patch(`/bookings/${bookingId}/no-show`);
export const markBookingAsInProgress = (bookingId) =>
    bookingService.patch(`/bookings/${bookingId}/in-progress`);

// Services & Categories
export const getAllServices = (params = {}) => bookingService.get('/services', { params });
export const getServiceById = (serviceId) => bookingService.get(`/services/${serviceId}`);
export const createService = (serviceData) => bookingService.post('/services', serviceData);
export const updateService = (serviceId, data) => bookingService.put(`/services/${serviceId}`, data);
export const deleteService = (serviceId) => bookingService.delete(`/services/${serviceId}`);
export const getServicesByCategory = (categoryId) =>
    bookingService.get(`/services/category/${categoryId}`);
export const getServicesByProvider = (providerId) =>
    bookingService.get(`/services/provider/${providerId}`);

// Categories Management
export const getAllCategories = () => bookingService.get('/categories');
export const getCategoryById = (categoryId) => bookingService.get(`/categories/${categoryId}`);
export const createCategory = (categoryData) => bookingService.post('/categories', categoryData);
export const updateCategory = (categoryId, data) => bookingService.put(`/categories/${categoryId}`, data);
export const deleteCategory = (categoryId) => bookingService.delete(`/categories/${categoryId}`);

// Time Slots & Availability
export const getAvailableTimeSlots = (serviceId, date) =>
    bookingService.get(`/services/${serviceId}/available-slots`, { params: { date } });
export const getTimeSlotsByDateRange = (serviceId, startDate, endDate) =>
    bookingService.get(`/services/${serviceId}/slots`, { params: { startDate, endDate } });
export const createTimeSlot = (slotData) => bookingService.post('/time-slots', slotData);
export const updateTimeSlot = (slotId, data) => bookingService.put(`/time-slots/${slotId}`, data);
export const deleteTimeSlot = (slotId) => bookingService.delete(`/time-slots/${slotId}`);

// Recurring Bookings
export const createRecurringBooking = (bookingData) =>
    bookingService.post('/bookings/recurring', bookingData);
export const updateRecurringBooking = (recurringId, data) =>
    bookingService.put(`/bookings/recurring/${recurringId}`, data);
export const cancelRecurringBooking = (recurringId) =>
    bookingService.delete(`/bookings/recurring/${recurringId}`);
export const getRecurringBookings = (userId) =>
    bookingService.get(`/bookings/recurring/user/${userId}`);

// Booking Search & Filtering
export const searchBookings = (query, params = {}) =>
    bookingService.get('/bookings/search', { params: { q: query, ...params } });
export const getBookingsByDateRange = (startDate, endDate, params = {}) =>
    bookingService.get('/bookings/date-range', { params: { startDate, endDate, ...params } });
export const getBookingsByStatus = (status, params = {}) =>
    bookingService.get(`/bookings/status/${status}`, { params });
export const getBookingsByService = (serviceId, params = {}) =>
    bookingService.get(`/bookings/service/${serviceId}`, { params });

// Payment & Billing
export const getBookingPayment = (bookingId) => bookingService.get(`/bookings/${bookingId}/payment`);
export const processBookingPayment = (bookingId, paymentData) =>
    bookingService.post(`/bookings/${bookingId}/payment`, paymentData);
export const refundBookingPayment = (bookingId, refundData) =>
    bookingService.post(`/bookings/${bookingId}/refund`, refundData);
export const getBookingInvoice = (bookingId) => bookingService.get(`/bookings/${bookingId}/invoice`);
export const sendBookingInvoice = (bookingId) => bookingService.post(`/bookings/${bookingId}/invoice/send`);

// Reviews & Ratings
export const getBookingReview = (bookingId) => bookingService.get(`/bookings/${bookingId}/review`);
export const createBookingReview = (bookingId, reviewData) =>
    bookingService.post(`/bookings/${bookingId}/review`, reviewData);
export const updateBookingReview = (bookingId, reviewData) =>
    bookingService.put(`/bookings/${bookingId}/review`, reviewData);
export const deleteBookingReview = (bookingId) => bookingService.delete(`/bookings/${bookingId}/review`);
export const getServiceReviews = (serviceId) => bookingService.get(`/services/${serviceId}/reviews`);
export const getProviderReviews = (providerId) => bookingService.get(`/providers/${providerId}/reviews`);

// Notifications & Reminders
export const getBookingNotifications = (bookingId) =>
    bookingService.get(`/bookings/${bookingId}/notifications`);
export const sendBookingReminder = (bookingId, reminderType) =>
    bookingService.post(`/bookings/${bookingId}/reminder`, { type: reminderType });
export const updateNotificationSettings = (userId, settings) =>
    bookingService.put(`/users/${userId}/notification-settings`, settings);
export const getNotificationSettings = (userId) =>
    bookingService.get(`/users/${userId}/notification-settings`);

// Waiting List
export const joinWaitingList = (serviceId, waitingListData) =>
    bookingService.post(`/services/${serviceId}/waiting-list`, waitingListData);
export const leaveWaitingList = (serviceId, userId) =>
    bookingService.delete(`/services/${serviceId}/waiting-list/${userId}`);
export const getWaitingList = (serviceId) => bookingService.get(`/services/${serviceId}/waiting-list`);
export const notifyWaitingList = (serviceId, availableSlot) =>
    bookingService.post(`/services/${serviceId}/waiting-list/notify`, availableSlot);

// Analytics & Reports
export const getBookingStatistics = (params = {}) =>
    bookingService.get('/bookings/statistics', { params });
export const getProviderStatistics = (providerId, params = {}) =>
    bookingService.get(`/providers/${providerId}/statistics`, { params });
export const getServiceStatistics = (serviceId, params = {}) =>
    bookingService.get(`/services/${serviceId}/statistics`, { params });
export const getRevenueReport = (startDate, endDate) =>
    bookingService.get('/reports/revenue', { params: { startDate, endDate } });
export const getBookingTrends = (period = 'monthly') =>
    bookingService.get('/reports/trends', { params: { period } });

// Calendar Integration
export const getBookingCalendar = (userId, month, year) =>
    bookingService.get(`/calendar/${userId}`, { params: { month, year } });
export const exportBookingsToCalendar = (userId, format = 'ical') =>
    bookingService.get(`/calendar/${userId}/export`, { params: { format } });
export const syncWithExternalCalendar = (userId, calendarData) =>
    bookingService.post(`/calendar/${userId}/sync`, calendarData);

// Settings & Configuration
export const getBookingSettings = () => bookingService.get('/settings');
export const updateBookingSettings = (settings) => bookingService.put('/settings', settings);
export const getBusinessHours = (providerId) => bookingService.get(`/providers/${providerId}/business-hours`);
export const updateBusinessHours = (providerId, hours) =>
    bookingService.put(`/providers/${providerId}/business-hours`, hours);
export const getHolidays = (year) => bookingService.get(`/holidays/${year}`);
export const addHoliday = (holidayData) => bookingService.post('/holidays', holidayData);
export const removeHoliday = (holidayId) => bookingService.delete(`/holidays/${holidayId}`);

// Health Check
export const getHealthStatus = () => bookingService.get('/health');

// API route handler for Next.js
export default async function handler(req, res) {
    const { method, query, body, headers } = req;
    const { id, action, type, userId, providerId, serviceId, bookingId, categoryId } = query;

    try {
        // Optional: Verify user authentication
        const token = headers.authorization?.replace('Bearer ', '');

        let response;

        switch (method) {
            case 'GET':
                if (type === 'bookings' && userId) {
                    response = await getUserBookings(userId, query);
                } else if (type === 'bookings' && id) {
                    response = await getBookingById(id);
                } else if (type === 'bookings') {
                    response = await getAllBookings(query);
                } else if (type === 'upcoming-bookings' && userId) {
                    response = await getUserUpcomingBookings(userId);
                } else if (type === 'past-bookings' && userId) {
                    response = await getUserPastBookings(userId);
                } else if (type === 'provider-bookings' && providerId) {
                    response = await getProviderBookings(providerId, query);
                } else if (type === 'provider-schedule' && providerId) {
                    response = await getProviderSchedule(providerId, query.date);
                } else if (type === 'provider-availability' && providerId) {
                    response = await getProviderAvailability(providerId, query);
                } else if (type === 'services' && id) {
                    response = await getServiceById(id);
                } else if (type === 'services') {
                    response = await getAllServices(query);
                } else if (type === 'services-by-category' && categoryId) {
                    response = await getServicesByCategory(categoryId);
                } else if (type === 'services-by-provider' && providerId) {
                    response = await getServicesByProvider(providerId);
                } else if (type === 'categories' && id) {
                    response = await getCategoryById(id);
                } else if (type === 'categories') {
                    response = await getAllCategories();
                } else if (type === 'available-slots' && serviceId) {
                    response = await getAvailableTimeSlots(serviceId, query.date);
                } else if (type === 'time-slots' && serviceId) {
                    response = await getTimeSlotsByDateRange(serviceId, query.startDate, query.endDate);
                } else if (type === 'recurring-bookings' && userId) {
                    response = await getRecurringBookings(userId);
                } else if (type === 'search-bookings') {
                    response = await searchBookings(query.q, query);
                } else if (type === 'bookings-by-date-range') {
                    response = await getBookingsByDateRange(query.startDate, query.endDate, query);
                } else if (type === 'bookings-by-status') {
                    response = await getBookingsByStatus(query.status, query);
                } else if (type === 'bookings-by-service' && serviceId) {
                    response = await getBookingsByService(serviceId, query);
                } else if (type === 'booking-payment' && bookingId) {
                    response = await getBookingPayment(bookingId);
                } else if (type === 'booking-invoice' && bookingId) {
                    response = await getBookingInvoice(bookingId);
                } else if (type === 'booking-review' && bookingId) {
                    response = await getBookingReview(bookingId);
                } else if (type === 'service-reviews' && serviceId) {
                    response = await getServiceReviews(serviceId);
                } else if (type === 'provider-reviews' && providerId) {
                    response = await getProviderReviews(providerId);
                } else if (type === 'booking-notifications' && bookingId) {
                    response = await getBookingNotifications(bookingId);
                } else if (type === 'notification-settings' && userId) {
                    response = await getNotificationSettings(userId);
                } else if (type === 'waiting-list' && serviceId) {
                    response = await getWaitingList(serviceId);
                } else if (type === 'booking-statistics') {
                    response = await getBookingStatistics(query);
                } else if (type === 'provider-statistics' && providerId) {
                    response = await getProviderStatistics(providerId, query);
                } else if (type === 'service-statistics' && serviceId) {
                    response = await getServiceStatistics(serviceId, query);
                } else if (type === 'revenue-report') {
                    response = await getRevenueReport(query.startDate, query.endDate);
                } else if (type === 'booking-trends') {
                    response = await getBookingTrends(query.period);
                } else if (type === 'booking-calendar' && userId) {
                    response = await getBookingCalendar(userId, query.month, query.year);
                } else if (type === 'calendar-export' && userId) {
                    response = await exportBookingsToCalendar(userId, query.format);
                } else if (type === 'booking-settings') {
                    response = await getBookingSettings();
                } else if (type === 'business-hours' && providerId) {
                    response = await getBusinessHours(providerId);
                } else if (type === 'holidays') {
                    response = await getHolidays(query.year);
                } else if (type === 'health') {
                    response = await getHealthStatus();
                }
                break;

            case 'POST':
                if (type === 'bookings') {
                    response = await createBooking(body);
                } else if (type === 'recurring-bookings') {
                    response = await createRecurringBooking(body);
                } else if (type === 'services') {
                    response = await createService(body);
                } else if (type === 'categories') {
                    response = await createCategory(body);
                } else if (type === 'time-slots') {
                    response = await createTimeSlot(body);
                } else if (type === 'provider-unavailable' && providerId) {
                    response = await setProviderUnavailable(providerId, body);
                } else if (type === 'booking-payment' && bookingId) {
                    response = await processBookingPayment(bookingId, body);
                } else if (type === 'booking-refund' && bookingId) {
                    response = await refundBookingPayment(bookingId, body);
                } else if (type === 'send-invoice' && bookingId) {
                    response = await sendBookingInvoice(bookingId);
                } else if (type === 'booking-review' && bookingId) {
                    response = await createBookingReview(bookingId, body);
                } else if (type === 'booking-reminder' && bookingId) {
                    response = await sendBookingReminder(bookingId, body.type);
                } else if (type === 'join-waiting-list' && serviceId) {
                    response = await joinWaitingList(serviceId, body);
                } else if (type === 'notify-waiting-list' && serviceId) {
                    response = await notifyWaitingList(serviceId, body);
                } else if (type === 'calendar-sync' && userId) {
                    response = await syncWithExternalCalendar(userId, body);
                } else if (type === 'holidays') {
                    response = await addHoliday(body);
                }
                break;

            case 'PUT':
                if (type === 'bookings' && id) {
                    response = await updateBooking(id, body);
                } else if (type === 'recurring-bookings' && id) {
                    response = await updateRecurringBooking(id, body);
                } else if (type === 'services' && id) {
                    response = await updateService(id, body);
                } else if (type === 'categories' && id) {
                    response = await updateCategory(id, body);
                } else if (type === 'time-slots' && id) {
                    response = await updateTimeSlot(id, body);
                } else if (type === 'booking-review' && bookingId) {
                    response = await updateBookingReview(bookingId, body);
                } else if (type === 'notification-settings' && userId) {
                    response = await updateNotificationSettings(userId, body);
                } else if (type === 'booking-settings') {
                    response = await updateBookingSettings(body);
                } else if (type === 'business-hours' && providerId) {
                    response = await updateBusinessHours(providerId, body);
                }
                break;

            case 'PATCH':
                if (type === 'bookings' && id && action === 'cancel') {
                    response = await cancelBooking(id, body.reason);
                } else if (type === 'bookings' && id && action === 'confirm') {
                    response = await confirmBooking(id);
                } else if (type === 'bookings' && id && action === 'reschedule') {
                    response = await rescheduleBooking(id, body.dateTime);
                } else if (type === 'bookings' && id && action === 'status') {
                    response = await updateBookingStatus(id, body.status);
                } else if (type === 'bookings' && id && action === 'complete') {
                    response = await markBookingAsCompleted(id);
                } else if (type === 'bookings' && id && action === 'no-show') {
                    response = await markBookingAsNoShow(id);
                } else if (type === 'bookings' && id && action === 'in-progress') {
                    response = await markBookingAsInProgress(id);
                }
                break;

            case 'DELETE':
                if (type === 'bookings' && id) {
                    response = await deleteBooking(id);
                } else if (type === 'recurring-bookings' && id) {
                    response = await cancelRecurringBooking(id);
                } else if (type === 'services' && id) {
                    response = await deleteService(id);
                } else if (type === 'categories' && id) {
                    response = await deleteCategory(id);
                } else if (type === 'time-slots' && id) {
                    response = await deleteTimeSlot(id);
                } else if (type === 'provider-unavailable' && providerId && id) {
                    response = await removeProviderUnavailable(providerId, id);
                } else if (type === 'booking-review' && bookingId) {
                    response = await deleteBookingReview(bookingId);
                } else if (type === 'leave-waiting-list' && serviceId && userId) {
                    response = await leaveWaitingList(serviceId, userId);
                } else if (type === 'holidays' && id) {
                    response = await removeHoliday(id);
                }
                break;

            default:
                res.status(405).json({ error: 'Method not allowed' });
                return;
        }

        res.status(200).json(response?.data || response);
    } catch (error) {
        console.error('Booking Service Error:', error);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || error.message
        });
    }
}