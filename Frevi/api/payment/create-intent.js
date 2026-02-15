// import Stripe from 'stripe';
//
// // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// // const API_BASE_URL = 'http://localhost:9191/api';
// //
// // export default async function handler(req, res) {
// //     if (req.method !== 'POST') {
// //         return res.status(405).end();
// //     }
// //
// //     try {
// //         const { amount } = req.body;
// //
// //         const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'usd' });
// //
// //         // Додаткова синхронізація з Payment Service
// //         await fetch(`${API_BASE_URL}/payments/create-intent`, {
// //             method: 'POST',
// //             headers: { 'Content-Type': 'application/json' },
// //             body: JSON.stringify({ amount, currency: 'usd' })
// //         });
// //
// //         res.status(200).json({ clientSecret: paymentIntent.client_secret });
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // }
// const express = require('express');
// const cors = require('cors');
// const Stripe = require('stripe');
// const fetch = require('node-fetch');
//
// const app = express();
// const PORT = process.env.PORT || 3001;
//
// // Initialize Stripe
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
//
// // API base URLs
// const API_BASE_URL = 'http://localhost:9191/api';
//
// app.use(cors());
// app.use(express.json());
//
// // Mock data for payments
// let payments = [];
// let paymentIdCounter = 1;
//
// // API client for communication with external services
// const apiClient = {
//     async request(url, options = {}) {
//         const response = await fetch(`${API_BASE_URL}${url}`, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 ...options.headers,
//             },
//             ...options,
//         });
//
//         if (!response.ok) {
//             const errorData = await response.json().catch(() => ({}));
//             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//         }
//
//         return response.json();
//     },
//
//     async post(url, data) {
//         return this.request(url, {
//             method: 'POST',
//             body: JSON.stringify(data),
//         });
//     },
//
//     async get(url) {
//         return this.request(url, { method: 'GET' });
//     },
//
//     async patch(url, data) {
//         return this.request(url, {
//             method: 'PATCH',
//             body: JSON.stringify(data),
//         });
//     }
// };
//
// // Create Payment Intent
// app.post('/api/payments/create-intent', async (req, res) => {
//     try {
//         const { amount, currency = 'usd', metadata = {}, customerId, description } = req.body;
//
//         if (!amount) {
//             return res.status(400).json({ error: 'Amount is required' });
//         }
//
//         // Create payment intent with Stripe
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: Math.round(amount * 100), // Convert to cents
//             currency: currency.toLowerCase(),
//             metadata: metadata,
//             customer: customerId,
//             description: description,
//             automatic_payment_methods: {
//                 enabled: true,
//             },
//         });
//
//         // Store payment locally
//         const payment = {
//             id: paymentIdCounter++,
//             paymentIntentId: paymentIntent.id,
//             amount: amount,
//             currency: currency,
//             status: 'requires_payment_method',
//             clientSecret: paymentIntent.client_secret,
//             metadata: metadata,
//             customerId: customerId,
//             description: description,
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString()
//         };
//
//         payments.push(payment);
//
//         // Sync with external payment service
//         try {
//             await apiClient.post('/payments/create-intent', {
//                 paymentIntentId: paymentIntent.id,
//                 amount: amount,
//                 currency: currency,
//                 status: 'requires_payment_method',
//                 metadata: metadata,
//                 customerId: customerId,
//                 description: description,
//                 createdAt: new Date().toISOString()
//             });
//         } catch (apiError) {
//             console.warn('Failed to sync with payment service:', apiError);
//         }
//
//         res.status(200).json({
//             success: true,
//             clientSecret: paymentIntent.client_secret,
//             paymentIntentId: paymentIntent.id,
//             payment: payment
//         });
//
//     } catch (error) {
//         console.error('Create payment intent error:', error);
//         res.status(500).json({
//             error: 'Failed to create payment intent',
//             details: error.message
//         });
//     }
// });
//
// // Confirm Payment Intent
// app.post('/api/payments/confirm', async (req, res) => {
//     try {
//         const { paymentIntentId, paymentMethodId } = req.body;
//
//         if (!paymentIntentId) {
//             return res.status(400).json({ error: 'PaymentIntent ID is required' });
//         }
//
//         // Confirm the payment intent
//         const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
//             payment_method: paymentMethodId,
//         });
//
//         // Update local payment record
//         const paymentIndex = payments.findIndex(p => p.paymentIntentId === paymentIntentId);
//         if (paymentIndex !== -1) {
//             payments[paymentIndex] = {
//                 ...payments[paymentIndex],
//                 status: paymentIntent.status,
//                 updatedAt: new Date().toISOString()
//             };
//         }
//
//         // Sync with external service
//         try {
//             await apiClient.patch(`/payments/${paymentIntentId}`, {
//                 status: paymentIntent.status,
//                 updatedAt: new Date().toISOString()
//             });
//         } catch (apiError) {
//             console.warn('Failed to sync payment confirmation:', apiError);
//         }
//
//         res.json({
//             success: true,
//             paymentIntent: paymentIntent,
//             payment: paymentIndex !== -1 ? payments[paymentIndex] : null
//         });
//
//     } catch (error) {
//         console.error('Confirm payment error:', error);
//         res.status(500).json({
//             error: 'Failed to confirm payment',
//             details: error.message
//         });
//     }
// });
//
// // Get Payment Intent status
// app.get('/api/payments/intent/:paymentIntentId', async (req, res) => {
//     try {
//         const { paymentIntentId } = req.params;
//
//         const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
//
//         // Find local payment record
//         const localPayment = payments.find(p => p.paymentIntentId === paymentIntentId);
//
//         res.json({
//             success: true,
//             paymentIntent: paymentIntent,
//             localPayment: localPayment
//         });
//
//     } catch (error) {
//         console.error('Get payment intent error:', error);
//         res.status(500).json({
//             error: 'Failed to get payment intent',
//             details: error.message
//         });
//     }
// });
//
// // Get user payments
// app.get('/api/payments/user/:userId', (req, res) => {
//     try {
//         const userId = req.params.userId;
//         const userPayments = payments.filter(payment =>
//             payment.metadata.userId === userId || payment.customerId === userId
//         );
//
//         res.json({
//             success: true,
//             payments: userPayments,
//             total: userPayments.length
//         });
//
//     } catch (error) {
//         console.error('Get user payments error:', error);
//         res.status(500).json({
//             error: 'Failed to get user payments',
//             details: error.message
//         });
//     }
// });
//
// // Create Customer
// app.post('/api/payments/customers', async (req, res) => {
//     try {
//         const { email, name, metadata = {} } = req.body;
//
//         const customer = await stripe.customers.create({
//             email: email,
//             name: name,
//             metadata: metadata
//         });
//
//         res.json({
//             success: true,
//             customer: customer
//         });
//
//     } catch (error) {
//         console.error('Create customer error:', error);
//         res.status(500).json({
//             error: 'Failed to create customer',
//             details: error.message
//         });
//     }
// });
//
// // Create Setup Intent for saving payment methods
// app.post('/api/payments/setup-intent', async (req, res) => {
//     try {
//         const { customerId, metadata = {} } = req.body;
//
//         const setupIntent = await stripe.setupIntents.create({
//             customer: customerId,
//             metadata: metadata,
//             payment_method_types: ['card']
//         });
//
//         res.json({
//             success: true,
//             clientSecret: setupIntent.client_secret,
//             setupIntent: setupIntent
//         });
//
//     } catch (error) {
//         console.error('Create setup intent error:', error);
//         res.status(500).json({
//             error: 'Failed to create setup intent',
//             details: error.message
//         });
//     }
// });
//
// // Get customer payment methods
// app.get('/api/payments/customers/:customerId/methods', async (req, res) => {
//     try {
//         const { customerId } = req.params;
//
//         const paymentMethods = await stripe.paymentMethods.list({
//             customer: customerId,
//             type: 'card'
//         });
//
//         res.json({
//             success: true,
//             paymentMethods: paymentMethods.data
//         });
//
//     } catch (error) {
//         console.error('Get payment methods error:', error);
//         res.status(500).json({
//             error: 'Failed to get payment methods',
//             details: error.message
//         });
//     }
// });
//
// // Refund payment
// app.post('/api/payments/refund', async (req, res) => {
//     try {
//         const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;
//
//         const refund = await stripe.refunds.create({
//             payment_intent: paymentIntentId,
//             amount: amount ? Math.round(amount * 100) : undefined,
//             reason: reason
//         });
//
//         // Update local payment record
//         const paymentIndex = payments.findIndex(p => p.paymentIntentId === paymentIntentId);
//         if (paymentIndex !== -1) {
//             payments[paymentIndex].refund = refund;
//             payments[paymentIndex].status = 'refunded';
//             payments[paymentIndex].updatedAt = new Date().toISOString();
//         }
//
//         // Sync with external service
//         try {
//             await apiClient.post('/payments/refund', {
//                 paymentIntentId: paymentIntentId,
//                 refundId: refund.id,
//                 amount: refund.amount / 100,
//                 status: 'refunded',
//                 reason: reason
//             });
//         } catch (apiError) {
//             console.warn('Failed to sync refund:', apiError);
//         }
//
//         res.json({
//             success: true,
//             refund: refund,
//             payment: paymentIndex !== -1 ? payments[paymentIndex] : null
//         });
//
//     } catch (error) {
//         console.error('Refund error:', error);
//         res.status(500).json({
//             error: 'Failed to process refund',
//             details: error.message
//         });
//     }
// });
//
// // Webhook handler for Stripe events
// app.post('/api/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;
//
//     try {
//         event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//     } catch (err) {
//         console.error('Webhook signature verification failed:', err.message);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }
//
//     // Handle the event
//     switch (event.type) {
//         case 'payment_intent.succeeded':
//             const paymentIntentSucceeded = event.data.object;
//             console.log('PaymentIntent was successful:', paymentIntentSucceeded.id);
//
//             // Update local payment record
//             const paymentIndex = payments.findIndex(p => p.paymentIntentId === paymentIntentSucceeded.id);
//             if (paymentIndex !== -1) {
//                 payments[paymentIndex].status = 'succeeded';
//                 payments[paymentIndex].updatedAt = new Date().toISOString();
//             }
//
//             // Sync with external service
//             try {
//                 await apiClient.patch(`/payments/${paymentIntentSucceeded.id}`, {
//                     status: 'succeeded',
//                     updatedAt: new Date().toISOString()
//                 });
//             } catch (apiError) {
//                 console.warn('Failed to sync payment success:', apiError);
//             }
//             break;
//
//         case 'payment_intent.payment_failed':
//             const paymentIntentFailed = event.data.object;
//             console.log('PaymentIntent failed:', paymentIntentFailed.id);
//
//             // Update local payment record
//             const failedIndex = payments.findIndex(p => p.paymentIntentId === paymentIntentFailed.id);
//             if (failedIndex !== -1) {
//                 payments[failedIndex].status = 'failed';
//                 payments[failedIndex].error = paymentIntentFailed.last_payment_error;
//                 payments[failedIndex].updatedAt = new Date().toISOString();
//             }
//             break;
//
//         default:
//             console.log(`Unhandled event type: ${event.type}`);
//     }
//
//     res.json({received: true});
// });
//
// // Health check endpoint
// app.get('/api/payments/health', async (req, res) => {
//     try {
//         const healthResponse = await apiClient.get('/health');
//         res.json({
//             status: 'healthy',
//             service: 'payment-service',
//             mainService: healthResponse,
//             timestamp: new Date().toISOString(),
//             paymentsCount: payments.length
//         });
//     } catch (error) {
//         res.json({
//             status: 'degraded',
//             service: 'payment-service',
//             mainService: 'unavailable',
//             error: error.message,
//             timestamp: new Date().toISOString(),
//             paymentsCount: payments.length
//         });
//     }
// });
//
// // Get payment by ID
// app.get('/api/payments/:id', (req, res) => {
//     try {
//         const paymentId = parseInt(req.params.id);
//         const payment = payments.find(p => p.id === paymentId);
//
//         if (!payment) {
//             return res.status(404).json({ error: 'Payment not found' });
//         }
//
//         res.json({
//             success: true,
//             payment: payment
//         });
//
//     } catch (error) {
//         console.error('Get payment error:', error);
//         res.status(500).json({
//             error: 'Failed to get payment',
//             details: error.message
//         });
//     }
// });
//
// app.listen(PORT, () => {
//     console.log(`Payment Service running on port ${PORT}`);
//     console.log(`External Service URL: ${API_BASE_URL}`);
// });
// api/payments.js (повна інтеграція payment service)
import axios from "axios";

const API_BASE_URL = 'http://localhost:9191/api';

const paymentService = axios.create({
    baseURL: API_BASE_URL,
});

// Default headers configuration
paymentService.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Payment Intents
export const createPaymentIntent = (paymentData) =>
    paymentService.post('/payments/create-intent', paymentData);
export const confirmPaymentIntent = (confirmData) =>
    paymentService.post('/payments/confirm', confirmData);
export const getPaymentIntent = (paymentIntentId) =>
    paymentService.get(`/payments/intent/${paymentIntentId}`);
export const updatePaymentIntent = (paymentIntentId, updateData) =>
    paymentService.patch(`/payments/intent/${paymentIntentId}`, updateData);
export const cancelPaymentIntent = (paymentIntentId, reason = '') =>
    paymentService.post(`/payments/intent/${paymentIntentId}/cancel`, { reason });

// Setup Intents (for saving payment methods)
export const createSetupIntent = (setupData) =>
    paymentService.post('/payments/setup-intent', setupData);
export const confirmSetupIntent = (setupIntentId, confirmData) =>
    paymentService.post(`/payments/setup-intent/${setupIntentId}/confirm`, confirmData);
export const getSetupIntent = (setupIntentId) =>
    paymentService.get(`/payments/setup-intent/${setupIntentId}`);
export const cancelSetupIntent = (setupIntentId) =>
    paymentService.post(`/payments/setup-intent/${setupIntentId}/cancel`);

// Customer Management
export const createCustomer = (customerData) =>
    paymentService.post('/payments/customers', customerData);
export const getCustomer = (customerId) =>
    paymentService.get(`/payments/customers/${customerId}`);
export const updateCustomer = (customerId, updateData) =>
    paymentService.put(`/payments/customers/${customerId}`, updateData);
export const deleteCustomer = (customerId) =>
    paymentService.delete(`/payments/customers/${customerId}`);
export const getAllCustomers = (params = {}) =>
    paymentService.get('/payments/customers', { params });
export const searchCustomers = (query, params = {}) =>
    paymentService.get('/payments/customers/search', { params: { q: query, ...params } });

// Payment Methods
export const getCustomerPaymentMethods = (customerId, type = 'card') =>
    paymentService.get(`/payments/customers/${customerId}/methods`, { params: { type } });
export const attachPaymentMethod = (paymentMethodId, customerId) =>
    paymentService.post(`/payments/methods/${paymentMethodId}/attach`, { customerId });
export const detachPaymentMethod = (paymentMethodId) =>
    paymentService.post(`/payments/methods/${paymentMethodId}/detach`);
export const getPaymentMethod = (paymentMethodId) =>
    paymentService.get(`/payments/methods/${paymentMethodId}`);
export const updatePaymentMethod = (paymentMethodId, updateData) =>
    paymentService.put(`/payments/methods/${paymentMethodId}`, updateData);

// Payments Management
export const getPaymentById = (paymentId) =>
    paymentService.get(`/payments/${paymentId}`);
export const getAllPayments = (params = {}) =>
    paymentService.get('/payments', { params });
export const getUserPayments = (userId, params = {}) =>
    paymentService.get(`/payments/user/${userId}`, { params });
export const getPaymentsByDateRange = (startDate, endDate, params = {}) =>
    paymentService.get('/payments/date-range', { params: { startDate, endDate, ...params } });
export const getPaymentsByStatus = (status, params = {}) =>
    paymentService.get(`/payments/status/${status}`, { params });
export const searchPayments = (query, params = {}) =>
    paymentService.get('/payments/search', { params: { q: query, ...params } });

// Refunds
export const createRefund = (refundData) =>
    paymentService.post('/payments/refund', refundData);
export const getRefund = (refundId) =>
    paymentService.get(`/payments/refunds/${refundId}`);
export const getAllRefunds = (params = {}) =>
    paymentService.get('/payments/refunds', { params });
export const updateRefund = (refundId, updateData) =>
    paymentService.put(`/payments/refunds/${refundId}`, updateData);
export const cancelRefund = (refundId) =>
    paymentService.post(`/payments/refunds/${refundId}/cancel`);

// Subscriptions
export const createSubscription = (subscriptionData) =>
    paymentService.post('/payments/subscriptions', subscriptionData);
export const getSubscription = (subscriptionId) =>
    paymentService.get(`/payments/subscriptions/${subscriptionId}`);
export const updateSubscription = (subscriptionId, updateData) =>
    paymentService.put(`/payments/subscriptions/${subscriptionId}`, updateData);
export const cancelSubscription = (subscriptionId, cancelData = {}) =>
    paymentService.post(`/payments/subscriptions/${subscriptionId}/cancel`, cancelData);
export const pauseSubscription = (subscriptionId, pauseData = {}) =>
    paymentService.post(`/payments/subscriptions/${subscriptionId}/pause`, pauseData);
export const resumeSubscription = (subscriptionId) =>
    paymentService.post(`/payments/subscriptions/${subscriptionId}/resume`);
export const getCustomerSubscriptions = (customerId) =>
    paymentService.get(`/payments/subscriptions/customer/${customerId}`);

// Products & Prices
export const createProduct = (productData) =>
    paymentService.post('/payments/products', productData);
export const getProduct = (productId) =>
    paymentService.get(`/payments/products/${productId}`);
export const updateProduct = (productId, updateData) =>
    paymentService.put(`/payments/products/${productId}`, updateData);
export const deleteProduct = (productId) =>
    paymentService.delete(`/payments/products/${productId}`);
export const getAllProducts = (params = {}) =>
    paymentService.get('/payments/products', { params });
export const createPrice = (priceData) =>
    paymentService.post('/payments/prices', priceData);
export const getPrice = (priceId) =>
    paymentService.get(`/payments/prices/${priceId}`);
export const updatePrice = (priceId, updateData) =>
    paymentService.put(`/payments/prices/${priceId}`, updateData);
export const getAllPrices = (params = {}) =>
    paymentService.get('/payments/prices', { params });

// Invoices
export const createInvoice = (invoiceData) =>
    paymentService.post('/payments/invoices', invoiceData);
export const getInvoice = (invoiceId) =>
    paymentService.get(`/payments/invoices/${invoiceId}`);
export const updateInvoice = (invoiceId, updateData) =>
    paymentService.put(`/payments/invoices/${invoiceId}`, updateData);
export const deleteInvoice = (invoiceId) =>
    paymentService.delete(`/payments/invoices/${invoiceId}`);
export const finalizeInvoice = (invoiceId) =>
    paymentService.post(`/payments/invoices/${invoiceId}/finalize`);
export const payInvoice = (invoiceId, paymentData = {}) =>
    paymentService.post(`/payments/invoices/${invoiceId}/pay`, paymentData);
export const sendInvoice = (invoiceId) =>
    paymentService.post(`/payments/invoices/${invoiceId}/send`);
export const voidInvoice = (invoiceId) =>
    paymentService.post(`/payments/invoices/${invoiceId}/void`);
export const getCustomerInvoices = (customerId) =>
    paymentService.get(`/payments/invoices/customer/${customerId}`);

// Coupons & Discounts
export const createCoupon = (couponData) =>
    paymentService.post('/payments/coupons', couponData);
export const getCoupon = (couponId) =>
    paymentService.get(`/payments/coupons/${couponId}`);
export const updateCoupon = (couponId, updateData) =>
    paymentService.put(`/payments/coupons/${couponId}`, updateData);
export const deleteCoupon = (couponId) =>
    paymentService.delete(`/payments/coupons/${couponId}`);
export const getAllCoupons = (params = {}) =>
    paymentService.get('/payments/coupons', { params });
export const validateCoupon = (couponCode, amount, customerId = null) =>
    paymentService.post('/payments/coupons/validate', { couponCode, amount, customerId });

// Checkout Sessions
export const createCheckoutSession = (sessionData) =>
    paymentService.post('/payments/checkout/sessions', sessionData);
export const getCheckoutSession = (sessionId) =>
    paymentService.get(`/payments/checkout/sessions/${sessionId}`);
export const expireCheckoutSession = (sessionId) =>
    paymentService.post(`/payments/checkout/sessions/${sessionId}/expire`);
export const listCheckoutSessions = (params = {}) =>
    paymentService.get('/payments/checkout/sessions', { params });

// Payment Analytics & Reports
export const getPaymentAnalytics = (params = {}) =>
    paymentService.get('/payments/analytics', { params });
export const getRevenuereport = (startDate, endDate, params = {}) =>
    paymentService.get('/payments/reports/revenue', { params: { startDate, endDate, ...params } });
export const getTransactionReport = (startDate, endDate, params = {}) =>
    paymentService.get('/payments/reports/transactions', { params: { startDate, endDate, ...params } });
export const getCustomerReport = (customerId, startDate, endDate) =>
    paymentService.get(`/payments/reports/customer/${customerId}`, { params: { startDate, endDate } });
export const getPaymentMethodStats = () =>
    paymentService.get('/payments/stats/payment-methods');
export const getFailureAnalysis = (params = {}) =>
    paymentService.get('/payments/analytics/failures', { params });

// Webhooks
export const processWebhook = (webhookData) =>
    paymentService.post('/payments/webhook', webhookData);
export const createWebhookEndpoint = (endpointData) =>
    paymentService.post('/payments/webhook-endpoints', endpointData);
export const getWebhookEndpoint = (endpointId) =>
    paymentService.get(`/payments/webhook-endpoints/${endpointId}`);
export const updateWebhookEndpoint = (endpointId, updateData) =>
    paymentService.put(`/payments/webhook-endpoints/${endpointId}`, updateData);
export const deleteWebhookEndpoint = (endpointId) =>
    paymentService.delete(`/payments/webhook-endpoints/${endpointId}`);
export const getAllWebhookEndpoints = () =>
    paymentService.get('/payments/webhook-endpoints');

// Disputes & Chargebacks
export const getDispute = (disputeId) =>
    paymentService.get(`/payments/disputes/${disputeId}`);
export const getAllDisputes = (params = {}) =>
    paymentService.get('/payments/disputes', { params });
export const updateDispute = (disputeId, updateData) =>
    paymentService.put(`/payments/disputes/${disputeId}`, updateData);
export const closeDispute = (disputeId) =>
    paymentService.post(`/payments/disputes/${disputeId}/close`);
export const submitDisputeEvidence = (disputeId, evidenceData) =>
    paymentService.post(`/payments/disputes/${disputeId}/evidence`, evidenceData);

// Payment Links
export const createPaymentLink = (linkData) =>
    paymentService.post('/payments/payment-links', linkData);
export const getPaymentLink = (linkId) =>
    paymentService.get(`/payments/payment-links/${linkId}`);
export const updatePaymentLink = (linkId, updateData) =>
    paymentService.put(`/payments/payment-links/${linkId}`, updateData);
export const deactivatePaymentLink = (linkId) =>
    paymentService.post(`/payments/payment-links/${linkId}/deactivate`);
export const getAllPaymentLinks = (params = {}) =>
    paymentService.get('/payments/payment-links', { params });

// Multi-party Payments & Splits
export const createPaymentSplit = (splitData) =>
    paymentService.post('/payments/splits', splitData);
export const getPaymentSplit = (splitId) =>
    paymentService.get(`/payments/splits/${splitId}`);
export const updatePaymentSplit = (splitId, updateData) =>
    paymentService.put(`/payments/splits/${splitId}`, updateData);
export const deletePaymentSplit = (splitId) =>
    paymentService.delete(`/payments/splits/${splitId}`);
export const processPaymentWithSplit = (paymentData, splitId) =>
    paymentService.post('/payments/process-with-split', { ...paymentData, splitId });

// Fraud Detection & Security
export const checkFraud = (transactionData) =>
    paymentService.post('/payments/fraud-check', transactionData);
export const getFraudAnalysis = (paymentId) =>
    paymentService.get(`/payments/${paymentId}/fraud-analysis`);
export const reportFraud = (paymentId, fraudData) =>
    paymentService.post(`/payments/${paymentId}/report-fraud`, fraudData);
export const blockPaymentMethod = (paymentMethodId, reason) =>
    paymentService.post(`/payments/methods/${paymentMethodId}/block`, { reason });
export const unblockPaymentMethod = (paymentMethodId) =>
    paymentService.post(`/payments/methods/${paymentMethodId}/unblock`);

// Tax Calculations
export const calculateTax = (taxData) =>
    paymentService.post('/payments/tax/calculate', taxData);
export const createTaxTransaction = (transactionData) =>
    paymentService.post('/payments/tax/transactions', transactionData);
export const getTaxTransaction = (transactionId) =>
    paymentService.get(`/payments/tax/transactions/${transactionId}`);
export const getTaxSettings = () =>
    paymentService.get('/payments/tax/settings');
export const updateTaxSettings = (settings) =>
    paymentService.put('/payments/tax/settings', settings);

// Currency & Exchange Rates
export const getSupportedCurrencies = () =>
    paymentService.get('/payments/currencies');
export const getExchangeRates = (baseCurrency = 'USD') =>
    paymentService.get('/payments/exchange-rates', { params: { base: baseCurrency } });
export const convertCurrency = (amount, fromCurrency, toCurrency) =>
    paymentService.post('/payments/currency/convert', { amount, fromCurrency, toCurrency });

// Payment Processing
export const processPayment = (paymentData) =>
    paymentService.post('/payments/process', paymentData);
export const capturePayment = (paymentIntentId, amount = null) =>
    paymentService.post(`/payments/intent/${paymentIntentId}/capture`, { amount });
export const voidPayment = (paymentIntentId) =>
    paymentService.post(`/payments/intent/${paymentIntentId}/void`);
export const retryPayment = (paymentIntentId) =>
    paymentService.post(`/payments/intent/${paymentIntentId}/retry`);

// Balance & Payouts
export const getBalance = () =>
    paymentService.get('/payments/balance');
export const getBalanceTransactions = (params = {}) =>
    paymentService.get('/payments/balance/transactions', { params });
export const createPayout = (payoutData) =>
    paymentService.post('/payments/payouts', payoutData);
export const getPayout = (payoutId) =>
    paymentService.get(`/payments/payouts/${payoutId}`);
export const cancelPayout = (payoutId) =>
    paymentService.post(`/payments/payouts/${payoutId}/cancel`);
export const getAllPayouts = (params = {}) =>
    paymentService.get('/payments/payouts', { params });

// Health Check
export const getHealthStatus = () =>
    paymentService.get('/payments/health');

// API route handler for Next.js
export default async function handler(req, res) {
    const { method, query, body, headers } = req;
    const { id, action, type, customerId, subscriptionId, invoiceId, productId, priceId } = query;

    try {
        // Optional: Verify user authentication
        const token = headers.authorization?.replace('Bearer ', '');

        let response;

        switch (method) {
            case 'GET':
                if (type === 'payments' && id) {
                    response = await getPaymentById(id);
                } else if (type === 'payments' && customerId) {
                    response = await getUserPayments(customerId, query);
                } else if (type === 'payments') {
                    response = await getAllPayments(query);
                } else if (type === 'payment-intent' && id) {
                    response = await getPaymentIntent(id);
                } else if (type === 'setup-intent' && id) {
                    response = await getSetupIntent(id);
                } else if (type === 'customers' && id) {
                    response = await getCustomer(id);
                } else if (type === 'customers') {
                    response = await getAllCustomers(query);
                } else if (type === 'customer-payment-methods' && customerId) {
                    response = await getCustomerPaymentMethods(customerId, query.type);
                } else if (type === 'payment-method' && id) {
                    response = await getPaymentMethod(id);
                } else if (type === 'refunds' && id) {
                    response = await getRefund(id);
                } else if (type === 'refunds') {
                    response = await getAllRefunds(query);
                } else if (type === 'subscriptions' && id) {
                    response = await getSubscription(id);
                } else if (type === 'customer-subscriptions' && customerId) {
                    response = await getCustomerSubscriptions(customerId);
                } else if (type === 'products' && id) {
                    response = await getProduct(id);
                } else if (type === 'products') {
                    response = await getAllProducts(query);
                } else if (type === 'prices' && id) {
                    response = await getPrice(id);
                } else if (type === 'prices') {
                    response = await getAllPrices(query);
                } else if (type === 'invoices' && id) {
                    response = await getInvoice(id);
                } else if (type === 'customer-invoices' && customerId) {
                    response = await getCustomerInvoices(customerId);
                } else if (type === 'coupons' && id) {
                    response = await getCoupon(id);
                } else if (type === 'coupons') {
                    response = await getAllCoupons(query);
                } else if (type === 'checkout-session' && id) {
                    response = await getCheckoutSession(id);
                } else if (type === 'checkout-sessions') {
                    response = await listCheckoutSessions(query);
                } else if (type === 'analytics') {
                    response = await getPaymentAnalytics(query);
                } else if (type === 'revenue-report') {
                    response = await getRevenuereport(query.startDate, query.endDate, query);
                } else if (type === 'transaction-report') {
                    response = await getTransactionReport(query.startDate, query.endDate, query);
                } else if (type === 'customer-report' && customerId) {
                    response = await getCustomerReport(customerId, query.startDate, query.endDate);
                } else if (type === 'payment-method-stats') {
                    response = await getPaymentMethodStats();
                } else if (type === 'failure-analysis') {
                    response = await getFailureAnalysis(query);
                } else if (type === 'webhook-endpoints' && id) {
                    response = await getWebhookEndpoint(id);
                } else if (type === 'webhook-endpoints') {
                    response = await getAllWebhookEndpoints();
                } else if (type === 'disputes' && id) {
                    response = await getDispute(id);
                } else if (type === 'disputes') {
                    response = await getAllDisputes(query);
                } else if (type === 'payment-links' && id) {
                    response = await getPaymentLink(id);
                } else if (type === 'payment-links') {
                    response = await getAllPaymentLinks(query);
                } else if (type === 'payment-splits' && id) {
                    response = await getPaymentSplit(id);
                } else if (type === 'currencies') {
                    response = await getSupportedCurrencies();
                } else if (type === 'exchange-rates') {
                    response = await getExchangeRates(query.base);
                } else if (type === 'balance') {
                    response = await getBalance();
                } else if (type === 'balance-transactions') {
                    response = await getBalanceTransactions(query);
                } else if (type === 'payouts' && id) {
                    response = await getPayout(id);
                } else if (type === 'payouts') {
                    response = await getAllPayouts(query);
                } else if (type === 'health') {
                    response = await getHealthStatus();
                }
                break;

            case 'POST':
                if (type === 'create-intent') {
                    response = await createPaymentIntent(body);
                } else if (type === 'confirm-payment') {
                    response = await confirmPaymentIntent(body);
                } else if (type === 'cancel-intent' && id) {
                    response = await cancelPaymentIntent(id, body.reason);
                } else if (type === 'setup-intent') {
                    response = await createSetupIntent(body);
                } else if (type === 'confirm-setup' && id) {
                    response = await confirmSetupIntent(id, body);
                } else if (type === 'cancel-setup' && id) {
                    response = await cancelSetupIntent(id);
                } else if (type === 'customers') {
                    response = await createCustomer(body);
                } else if (type === 'attach-payment-method' && id) {
                    response = await attachPaymentMethod(id, body.customerId);
                } else if (type === 'detach-payment-method' && id) {
                    response = await detachPaymentMethod(id);
                } else if (type === 'refunds') {
                    response = await createRefund(body);
                } else if (type === 'subscriptions') {
                    response = await createSubscription(body);
                } else if (type === 'cancel-subscription' && subscriptionId) {
                    response = await cancelSubscription(subscriptionId, body);
                } else if (type === 'pause-subscription' && subscriptionId) {
                    response = await pauseSubscription(subscriptionId, body);
                } else if (type === 'resume-subscription' && subscriptionId) {
                    response = await resumeSubscription(subscriptionId);
                } else if (type === 'products') {
                    response = await createProduct(body);
                } else if (type === 'prices') {
                    response = await createPrice(body);
                } else if (type === 'invoices') {
                    response = await createInvoice(body);
                } else if (type === 'finalize-invoice' && invoiceId) {
                    response = await finalizeInvoice(invoiceId);
                } else if (type === 'pay-invoice' && invoiceId) {
                    response = await payInvoice(invoiceId, body);
                } else if (type === 'send-invoice' && invoiceId) {
                    response = await sendInvoice(invoiceId);
                } else if (type === 'void-invoice' && invoiceId) {
                    response = await voidInvoice(invoiceId);
                } else if (type === 'coupons') {
                    response = await createCoupon(body);
                } else if (type === 'validate-coupon') {
                    response = await validateCoupon(body.couponCode, body.amount, body.customerId);
                } else if (type === 'checkout-sessions') {
                    response = await createCheckoutSession(body);
                } else if (type === 'expire-session' && id) {
                    response = await expireCheckoutSession(id);
                } else if (type === 'webhook') {
                    response = await processWebhook(body);
                } else if (type === 'webhook-endpoints') {
                    response = await createWebhookEndpoint(body);
                } else if (type === 'close-dispute' && id) {
                    response = await closeDispute(id);
                } else if (type === 'dispute-evidence' && id) {
                    response = await submitDisputeEvidence(id, body);
                } else if (type === 'payment-links') {
                    response = await createPaymentLink(body);
                } else if (type === 'deactivate-link' && id) {
                    response = await deactivatePaymentLink(id);
                } else if (type === 'payment-splits') {
                    response = await createPaymentSplit(body);
                } else if (type === 'process-with-split') {
                    response = await processPaymentWithSplit(body, body.splitId);
                } else if (type === 'fraud-check') {
                    response = await checkFraud(body);
                } else if (type === 'report-fraud' && id) {
                    response = await reportFraud(id, body);
                } else if (type === 'block-payment-method' && id) {
                    response = await blockPaymentMethod(id, body.reason);
                } else if (type === 'unblock-payment-method' && id) {
                    response = await unblockPaymentMethod(id);
                } else if (type === 'calculate-tax') {
                    response = await calculateTax(body);
                } else if (type === 'tax-transactions') {
                    response = await createTaxTransaction(body);
                } else if (type === 'convert-currency') {
                    response = await convertCurrency(body.amount, body.fromCurrency, body.toCurrency);
                } else if (type === 'process-payment') {
                    response = await processPayment(body);
                } else if (type === 'capture-payment' && id) {
                    response = await capturePayment(id, body.amount);
                } else if (type === 'void-payment' && id) {
                    response = await voidPayment(id);
                } else if (type === 'retry-payment' && id) {
                    response = await retryPayment(id);
                } else if (type === 'payouts') {
                    response = await createPayout(body);
                } else if (type === 'cancel-payout' && id) {
                    response = await cancelPayout(id);
                }
                break;

            case 'PUT':
                if (type === 'customers' && id) {
                    response = await updateCustomer(id, body);
                } else if (type === 'payment-methods' && id) {
                    response = await updatePaymentMethod(id, body);
                } else if (type === 'refunds' && id) {
                    response = await updateRefund(id, body);
                } else if (type === 'subscriptions' && id) {
                    response = await updateSubscription(id, body);
                } else if (type === 'products' && id) {
                    response = await updateProduct(id, body);
                } else if (type === 'prices' && id) {
                    response = await updatePrice(id, body);
                } else if (type === 'invoices' && id) {
                    response = await updateInvoice(id, body);
                } else if (type === 'coupons' && id) {
                    response = await updateCoupon(id, body);
                } else if (type === 'payment-links' && id) {
                    response = await updatePaymentLink(id, body);
                } else if (type === 'payment-splits' && id) {
                    response = await updatePaymentSplit(id, body);
                } else if (type === 'disputes' && id) {
                    response = await updateDispute(id, body);
                } else if (type === 'webhook-endpoints' && id) {
                    response = await updateWebhookEndpoint(id, body);
                } else if (type === 'tax-settings') {
                    response = await updateTaxSettings(body);
                }
                break;

            case 'PATCH':
                if (type === 'payment-intent' && id) {
                    response = await updatePaymentIntent(id, body);
                }
                break;

            case 'DELETE':
                if (type === 'customers' && id) {
                    response = await deleteCustomer(id);
                } else if (type === 'products' && id) {
                    response = await deleteProduct(id);
                } else if (type === 'invoices' && id) {
                    response = await deleteInvoice(id);
                } else if (type === 'coupons' && id) {
                    response = await deleteCoupon(id);
                } else if (type === 'payment-splits' && id) {
                    response = await deletePaymentSplit(id);
                } else if (type === 'webhook-endpoints' && id) {
                    response = await deleteWebhookEndpoint(id);
                }
                break;

            default:
                res.status(405).json({ error: 'Method not allowed' });
                return;
        }

        res.status(200).json(response?.data || response);
    } catch (error) {
        console.error('Payment Service Error:', error);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || error.message
        });
    }
}