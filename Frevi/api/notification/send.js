 import { adminMessaging } from '../../../firebase/init';
//
// const API_BASE_URL = 'http://localhost:9191/api';
//
// export default async function handler(req, res) {
//     const { token, title, body } = req.body;
//
//     // Відправляємо через Firebase
//     await adminMessaging.send({ token, notification: { title, body } });
//
//     // Додаткова синхронізація з Notification Service
//     await fetch(`${API_BASE_URL}/notifications/send`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token, title, body })
//     });
//
//     res.status(200).json({ success: true });
// }
//  const express = require('express');
//  const cors = require('cors');
//  const http = require('http');
//  const admin = require('firebase-admin');
//
//  const app = express();
//  const server = http.createServer(app);
//  const PORT = process.env.PORT || 3000;
//
//  // Firebase Admin SDK initialization
//  const serviceAccount = require('./path/to/serviceAccountKey.json');
//  admin.initializeApp({
//      credential: admin.credential.cert(serviceAccount)
//  });
//  const adminMessaging = admin.messaging();
//
//  // API base URLs
//  const API_BASE_URL = 'http://localhost:9191/api';
//
//  app.use(cors());
//  app.use(express.json());
//
//  // Mock data for notifications
//  let notifications = [];
//  let notificationIdCounter = 1;
//
//  // API client for communication with external services
//  const apiClient = {
//      async request(url, options = {}) {
//          const response = await fetch(`${API_BASE_URL}${url}`, {
//              headers: {
//                  'Content-Type': 'application/json',
//                  ...options.headers,
//              },
//              ...options,
//          });
//
//          if (!response.ok) {
//              const errorData = await response.json().catch(() => ({}));
//              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//          }
//
//          return response.json();
//      },
//
//      async post(url, data) {
//          return this.request(url, {
//              method: 'POST',
//              body: JSON.stringify(data),
//          });
//      },
//
//      async get(url) {
//          return this.request(url, { method: 'GET' });
//      },
//
//      async patch(url, data) {
//          return this.request(url, {
//              method: 'PATCH',
//              body: JSON.stringify(data),
//          });
//      },
//
//      async delete(url) {
//          return this.request(url, { method: 'DELETE' });
//      }
//  };
//
//  // Send notification to single device
//  app.post('/api/notifications/send', async (req, res) => {
//      try {
//          const { token, title, body, data, userId, type = 'general' } = req.body;
//
//          if (!token || !title || !body) {
//              return res.status(400).json({ error: 'Missing required fields: token, title, body' });
//          }
//
//          // Create notification object
//          const notification = {
//              id: notificationIdCounter++,
//              token,
//              title,
//              body,
//              data: data || {},
//              userId,
//              type,
//              status: 'sent',
//              timestamp: new Date().toISOString(),
//              createdAt: new Date().toISOString()
//          };
//
//          // Send via Firebase
//          const message = {
//              token: token,
//              notification: {
//                  title: title,
//                  body: body
//              },
//              data: data || {}
//          };
//
//          try {
//              const response = await adminMessaging.send(message);
//              notification.messageId = response;
//              notification.status = 'delivered';
//
//              // Store notification locally
//              notifications.push(notification);
//
//          } catch (firebaseError) {
//              notification.status = 'failed';
//              notification.error = firebaseError.message;
//              notifications.push(notification);
//              throw firebaseError;
//          }
//
//          // Sync with external notification service
//          try {
//              await apiClient.post('/notifications/log', {
//                  notificationId: notification.id,
//                  token,
//                  title,
//                  body,
//                  data: data || {},
//                  userId,
//                  type,
//                  status: notification.status,
//                  timestamp: new Date().toISOString(),
//                  platform: 'fcm'
//              });
//          } catch (apiError) {
//              console.warn('Failed to sync with notification service:', apiError);
//          }
//
//          res.status(200).json({
//              success: true,
//              notification: notification,
//              message: 'Notification sent successfully'
//          });
//
//      } catch (error) {
//          console.error('Notification send error:', error);
//          res.status(500).json({
//              error: 'Failed to send notification',
//              details: error.message
//          });
//      }
//  });
//
//  // Send notification to multiple devices
//  app.post('/api/notifications/send-multiple', async (req, res) => {
//      try {
//          const { tokens, title, body, data, userIds, type = 'broadcast' } = req.body;
//
//          if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
//              return res.status(400).json({ error: 'Missing required fields: tokens array, title, body' });
//          }
//
//          // Send via Firebase
//          const message = {
//              tokens: tokens,
//              notification: {
//                  title: title,
//                  body: body
//              },
//              data: data || {}
//          };
//
//          const response = await adminMessaging.sendEachForMulticast(message);
//
//          // Create notification records
//          const batchNotifications = tokens.map((token, index) => ({
//              id: notificationIdCounter++,
//              token,
//              title,
//              body,
//              data: data || {},
//              userId: userIds ? userIds[index] : null,
//              type,
//              status: response.responses[index].success ? 'delivered' : 'failed',
//              messageId: response.responses[index].messageId,
//              error: response.responses[index].error ? response.responses[index].error.message : null,
//              timestamp: new Date().toISOString(),
//              createdAt: new Date().toISOString()
//          }));
//
//          // Store notifications locally
//          notifications.push(...batchNotifications);
//
//          // Sync with Notification Service
//          try {
//              await apiClient.post('/notifications/send-batch', {
//                  notifications: batchNotifications,
//                  successCount: response.successCount,
//                  failureCount: response.failureCount,
//                  timestamp: new Date().toISOString()
//              });
//          } catch (apiError) {
//              console.warn('Failed to sync batch with notification service:', apiError);
//          }
//
//          res.status(200).json({
//              success: true,
//              message: 'Notifications sent successfully',
//              results: {
//                  successCount: response.successCount,
//                  failureCount: response.failureCount,
//                  notifications: batchNotifications
//              }
//          });
//
//      } catch (error) {
//          console.error('Multiple notifications send error:', error);
//          res.status(500).json({
//              error: 'Failed to send notifications',
//              details: error.message
//          });
//      }
//  });
//
//  // Send notification to topic
//  app.post('/api/notifications/send-to-topic', async (req, res) => {
//      try {
//          const { topic, title, body, data, type = 'topic' } = req.body;
//
//          if (!topic || !title || !body) {
//              return res.status(400).json({ error: 'Missing required fields: topic, title, body' });
//          }
//
//          // Send via Firebase
//          const message = {
//              topic: topic,
//              notification: {
//                  title: title,
//                  body: body
//              },
//              data: data || {}
//          };
//
//          const response = await adminMessaging.send(message);
//
//          // Create notification record
//          const notification = {
//              id: notificationIdCounter++,
//              topic,
//              title,
//              body,
//              data: data || {},
//              type,
//              status: 'delivered',
//              messageId: response,
//              timestamp: new Date().toISOString(),
//              createdAt: new Date().toISOString()
//          };
//
//          notifications.push(notification);
//
//          // Sync with external service
//          try {
//              await apiClient.post('/notifications/topic', {
//                  topic,
//                  title,
//                  body,
//                  data: data || {},
//                  type,
//                  messageId: response,
//                  timestamp: new Date().toISOString()
//              });
//          } catch (apiError) {
//              console.warn('Failed to sync topic notification:', apiError);
//          }
//
//          res.status(200).json({
//              success: true,
//              notification: notification,
//              message: 'Topic notification sent successfully'
//          });
//
//      } catch (error) {
//          console.error('Topic notification send error:', error);
//          res.status(500).json({
//              error: 'Failed to send topic notification',
//              details: error.message
//          });
//      }
//  });
//
//  // Get user notifications
//  app.get('/api/notifications/user/:userId', (req, res) => {
//      try {
//          const userId = req.params.userId;
//          const { limit = 50, offset = 0, type } = req.query;
//
//          let userNotifications = notifications.filter(notif => notif.userId === userId);
//
//          if (type) {
//              userNotifications = userNotifications.filter(notif => notif.type === type);
//          }
//
//          // Sort by timestamp descending
//          userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
//
//          const paginatedNotifications = userNotifications.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
//
//          res.json({
//              success: true,
//              data: paginatedNotifications,
//              total: userNotifications.length,
//              hasMore: userNotifications.length > parseInt(offset) + parseInt(limit)
//          });
//
//      } catch (error) {
//          console.error('Get notifications error:', error);
//          res.status(500).json({
//              error: 'Failed to get notifications',
//              details: error.message
//          });
//      }
//  });
//
//  // Get notification by ID
//  app.get('/api/notifications/:id', (req, res) => {
//      try {
//          const notificationId = parseInt(req.params.id);
//          const notification = notifications.find(notif => notif.id === notificationId);
//
//          if (!notification) {
//              return res.status(404).json({ error: 'Notification not found' });
//          }
//
//          res.json({
//              success: true,
//              data: notification
//          });
//
//      } catch (error) {
//          console.error('Get notification error:', error);
//          res.status(500).json({
//              error: 'Failed to get notification',
//              details: error.message
//          });
//      }
//  });
//
//  // Get notification statistics
//  app.get('/api/notifications/stats/user/:userId', (req, res) => {
//      try {
//          const userId = req.params.userId;
//          const userNotifications = notifications.filter(notif => notif.userId === userId);
//
//          const stats = {
//              total: userNotifications.length,
//              delivered: userNotifications.filter(notif => notif.status === 'delivered').length,
//              failed: userNotifications.filter(notif => notif.status === 'failed').length,
//              byType: {},
//              byDate: {}
//          };
//
//          // Count by type
//          userNotifications.forEach(notif => {
//              stats.byType[notif.type] = (stats.byType[notif.type] || 0) + 1;
//          });
//
//          // Count by date
//          userNotifications.forEach(notif => {
//              const date = new Date(notif.timestamp).toISOString().split('T')[0];
//              stats.byDate[date] = (stats.byDate[date] || 0) + 1;
//          });
//
//          res.json({
//              success: true,
//              stats: stats
//          });
//
//      } catch (error) {
//          console.error('Get notification stats error:', error);
//          res.status(500).json({
//              error: 'Failed to get notification statistics',
//              details: error.message
//          });
//      }
//  });
//
//  // Mark notification as read
//  app.patch('/api/notifications/:id/read', (req, res) => {
//      try {
//          const notificationId = parseInt(req.params.id);
//          const notification = notifications.find(notif => notif.id === notificationId);
//
//          if (!notification) {
//              return res.status(404).json({ error: 'Notification not found' });
//          }
//
//          notification.read = true;
//          notification.readAt = new Date().toISOString();
//
//          // Sync with external service
//          try {
//              apiClient.patch(`/notifications/${notificationId}/read`, {
//                  read: true,
//                  readAt: notification.readAt
//              });
//          } catch (apiError) {
//              console.warn('Failed to sync read status:', apiError);
//          }
//
//          res.json({
//              success: true,
//              notification: notification,
//              message: 'Notification marked as read'
//          });
//
//      } catch (error) {
//          console.error('Mark as read error:', error);
//          res.status(500).json({
//              error: 'Failed to mark notification as read',
//              details: error.message
//          });
//      }
//  });
//
//  // Delete notification
//  app.delete('/api/notifications/:id', (req, res) => {
//      try {
//          const notificationId = parseInt(req.params.id);
//          const notificationIndex = notifications.findIndex(notif => notif.id === notificationId);
//
//          if (notificationIndex === -1) {
//              return res.status(404).json({ error: 'Notification not found' });
//          }
//
//          const deletedNotification = notifications[notificationIndex];
//          notifications.splice(notificationIndex, 1);
//
//          // Sync with external service
//          try {
//              apiClient.delete(`/notifications/${notificationId}`);
//          } catch (apiError) {
//              console.warn('Failed to sync deletion:', apiError);
//          }
//
//          res.json({
//              success: true,
//              message: 'Notification deleted successfully',
//              notification: deletedNotification
//          });
//
//      } catch (error) {
//          console.error('Delete notification error:', error);
//          res.status(500).json({
//              error: 'Failed to delete notification',
//              details: error.message
//          });
//      }
//  });
//
//  // Health check endpoint
//  app.get('/api/health', async (req, res) => {
//      try {
//          const healthResponse = await apiClient.get('/health');
//          res.json({
//              status: 'healthy',
//              service: 'notification-service',
//              mainService: healthResponse,
//              timestamp: new Date().toISOString(),
//              notificationsCount: notifications.length
//          });
//      } catch (error) {
//          res.json({
//              status: 'degraded',
//              service: 'notification-service',
//              mainService: 'unavailable',
//              error: error.message,
//              timestamp: new Date().toISOString(),
//              notificationsCount: notifications.length
//          });
//      }
//  });
//
//  // Subscribe to topic
//  app.post('/api/notifications/subscribe', async (req, res) => {
//      try {
//          const { tokens, topic } = req.body;
//
//          if (!tokens || !topic) {
//              return res.status(400).json({ error: 'Missing required fields: tokens, topic' });
//          }
//
//          const response = await adminMessaging.subscribeToTopic(tokens, topic);
//
//          res.json({
//              success: true,
//              message: 'Subscribed to topic successfully',
//              results: {
//                  successCount: response.successCount,
//                  failureCount: response.failureCount
//              }
//          });
//
//      } catch (error) {
//          console.error('Subscribe error:', error);
//          res.status(500).json({
//              error: 'Failed to subscribe to topic',
//              details: error.message
//          });
//      }
//  });
//
//  // Unsubscribe from topic
//  app.post('/api/notifications/unsubscribe', async (req, res) => {
//      try {
//          const { tokens, topic } = req.body;
//
//          if (!tokens || !topic) {
//              return res.status(400).json({ error: 'Missing required fields: tokens, topic' });
//          }
//
//          const response = await adminMessaging.unsubscribeFromTopic(tokens, topic);
//
//          res.json({
//              success: true,
//              message: 'Unsubscribed from topic successfully',
//              results: {
//                  successCount: response.successCount,
//                  failureCount: response.failureCount
//              }
//          });
//
//      } catch (error) {
//          console.error('Unsubscribe error:', error);
//          res.status(500).json({
//              error: 'Failed to unsubscribe from topic',
//              details: error.message
//          });
//      }
//  });
//
//  server.listen(PORT, () => {
//      console.log(`Notification Service running on port ${PORT}`);
//      console.log(`External Service URL: ${API_BASE_URL}`);
//  });
 // api/notifications.js (повна інтеграція notification service)
 import axios from "axios";

 const API_BASE_URL = 'http://localhost:9191/api';

 const notificationService = axios.create({
     baseURL: API_BASE_URL,
 });

 // Default headers configuration
 notificationService.interceptors.request.use((config) => {
     const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

     if (token) {
         config.headers.Authorization = `Bearer ${token}`;
     }

     config.headers['Content-Type'] = 'application/json';
     return config;
 });

 // Single Device Notifications
 export const sendNotification = (notificationData) =>
     notificationService.post('/notifications/send', notificationData);
 export const sendNotificationToUser = (userId, title, body, data = {}) =>
     notificationService.post('/notifications/send', {
         userId,
         title,
         body,
         data,
         type: 'user'
     });

 // Multiple Device Notifications
 export const sendMultipleNotifications = (notificationData) =>
     notificationService.post('/notifications/send-multiple', notificationData);
 export const sendBroadcastNotification = (tokens, title, body, data = {}) =>
     notificationService.post('/notifications/send-multiple', {
         tokens,
         title,
         body,
         data,
         type: 'broadcast'
     });

 // Topic Notifications
 export const sendTopicNotification = (topicData) =>
     notificationService.post('/notifications/send-to-topic', topicData);
 export const sendNotificationToTopic = (topic, title, body, data = {}) =>
     notificationService.post('/notifications/send-to-topic', {
         topic,
         title,
         body,
         data,
         type: 'topic'
     });

 // User Notifications Management
 export const getUserNotifications = (userId, params = {}) =>
     notificationService.get(`/notifications/user/${userId}`, { params });
 export const getNotificationById = (notificationId) =>
     notificationService.get(`/notifications/${notificationId}`);
 export const markNotificationAsRead = (notificationId) =>
     notificationService.patch(`/notifications/${notificationId}/read`);
 export const markAllNotificationsAsRead = (userId) =>
     notificationService.patch(`/notifications/user/${userId}/read-all`);
 export const deleteNotification = (notificationId) =>
     notificationService.delete(`/notifications/${notificationId}`);
 export const deleteAllUserNotifications = (userId) =>
     notificationService.delete(`/notifications/user/${userId}/all`);

 // Notification Statistics
 export const getUserNotificationStats = (userId) =>
     notificationService.get(`/notifications/stats/user/${userId}`);
 export const getSystemNotificationStats = () =>
     notificationService.get('/notifications/stats/system');
 export const getNotificationAnalytics = (params = {}) =>
     notificationService.get('/notifications/analytics', { params });
 export const getNotificationDeliveryStats = (startDate, endDate) =>
     notificationService.get('/notifications/stats/delivery', {
         params: { startDate, endDate }
     });

 // Topic Management
 export const subscribeToTopic = (tokens, topic) =>
     notificationService.post('/notifications/subscribe', { tokens, topic });
 export const unsubscribeFromTopic = (tokens, topic) =>
     notificationService.post('/notifications/unsubscribe', { tokens, topic });
 export const getUserTopics = (userId) =>
     notificationService.get(`/notifications/topics/user/${userId}`);
 export const getAllTopics = () =>
     notificationService.get('/notifications/topics');
 export const createTopic = (topicData) =>
     notificationService.post('/notifications/topics', topicData);
 export const deleteTopic = (topic) =>
     notificationService.delete(`/notifications/topics/${topic}`);

 // Device Token Management
 export const registerDeviceToken = (tokenData) =>
     notificationService.post('/notifications/tokens', tokenData);
 export const updateDeviceToken = (tokenId, tokenData) =>
     notificationService.put(`/notifications/tokens/${tokenId}`, tokenData);
 export const deleteDeviceToken = (tokenId) =>
     notificationService.delete(`/notifications/tokens/${tokenId}`);
 export const getUserTokens = (userId) =>
     notificationService.get(`/notifications/tokens/user/${userId}`);
 export const validateToken = (token) =>
     notificationService.post('/notifications/tokens/validate', { token });

 // Notification Templates
 export const getAllTemplates = (params = {}) =>
     notificationService.get('/notifications/templates', { params });
 export const getTemplateById = (templateId) =>
     notificationService.get(`/notifications/templates/${templateId}`);
 export const createTemplate = (templateData) =>
     notificationService.post('/notifications/templates', templateData);
 export const updateTemplate = (templateId, templateData) =>
     notificationService.put(`/notifications/templates/${templateId}`, templateData);
 export const deleteTemplate = (templateId) =>
     notificationService.delete(`/notifications/templates/${templateId}`);
 export const sendTemplateNotification = (templateId, recipients, variables = {}) =>
     notificationService.post(`/notifications/templates/${templateId}/send`, {
         recipients,
         variables
     });

 // Scheduled Notifications
 export const scheduleNotification = (scheduleData) =>
     notificationService.post('/notifications/schedule', scheduleData);
 export const getScheduledNotifications = (params = {}) =>
     notificationService.get('/notifications/scheduled', { params });
 export const getScheduledNotificationById = (scheduleId) =>
     notificationService.get(`/notifications/scheduled/${scheduleId}`);
 export const updateScheduledNotification = (scheduleId, scheduleData) =>
     notificationService.put(`/notifications/scheduled/${scheduleId}`, scheduleData);
 export const cancelScheduledNotification = (scheduleId) =>
     notificationService.delete(`/notifications/scheduled/${scheduleId}`);

 // Notification Preferences
 export const getUserPreferences = (userId) =>
     notificationService.get(`/notifications/preferences/user/${userId}`);
 export const updateUserPreferences = (userId, preferences) =>
     notificationService.put(`/notifications/preferences/user/${userId}`, preferences);
 export const getDefaultPreferences = () =>
     notificationService.get('/notifications/preferences/default');
 export const updateDefaultPreferences = (preferences) =>
     notificationService.put('/notifications/preferences/default', preferences);

 // Push Notification Settings
 export const getPushSettings = (userId) =>
     notificationService.get(`/notifications/push-settings/user/${userId}`);
 export const updatePushSettings = (userId, settings) =>
     notificationService.put(`/notifications/push-settings/user/${userId}`, settings);
 export const enablePushNotifications = (userId, deviceToken) =>
     notificationService.patch(`/notifications/push-settings/user/${userId}/enable`, { deviceToken });
 export const disablePushNotifications = (userId) =>
     notificationService.patch(`/notifications/push-settings/user/${userId}/disable`);

 // Notification History & Logs
 export const getNotificationHistory = (params = {}) =>
     notificationService.get('/notifications/history', { params });
 export const getNotificationLogs = (params = {}) =>
     notificationService.get('/notifications/logs', { params });
 export const getFailedNotifications = (params = {}) =>
     notificationService.get('/notifications/failed', { params });
 export const retryFailedNotification = (notificationId) =>
     notificationService.post(`/notifications/${notificationId}/retry`);
 export const retryAllFailedNotifications = () =>
     notificationService.post('/notifications/retry-all-failed');

 // Campaign Management
 export const createCampaign = (campaignData) =>
     notificationService.post('/notifications/campaigns', campaignData);
 export const getAllCampaigns = (params = {}) =>
     notificationService.get('/notifications/campaigns', { params });
 export const getCampaignById = (campaignId) =>
     notificationService.get(`/notifications/campaigns/${campaignId}`);
 export const updateCampaign = (campaignId, campaignData) =>
     notificationService.put(`/notifications/campaigns/${campaignId}`, campaignData);
 export const deleteCampaign = (campaignId) =>
     notificationService.delete(`/notifications/campaigns/${campaignId}`);
 export const startCampaign = (campaignId) =>
     notificationService.post(`/notifications/campaigns/${campaignId}/start`);
 export const stopCampaign = (campaignId) =>
     notificationService.post(`/notifications/campaigns/${campaignId}/stop`);
 export const getCampaignStats = (campaignId) =>
     notificationService.get(`/notifications/campaigns/${campaignId}/stats`);

 // Rich Notifications
 export const sendRichNotification = (richNotificationData) =>
     notificationService.post('/notifications/rich', richNotificationData);
 export const sendImageNotification = (recipients, title, body, imageUrl, data = {}) =>
     notificationService.post('/notifications/rich', {
         recipients,
         title,
         body,
         media: { type: 'image', url: imageUrl },
         data
     });
 export const sendActionNotification = (recipients, title, body, actions, data = {}) =>
     notificationService.post('/notifications/rich', {
         recipients,
         title,
         body,
         actions,
         data
     });

 // Notification Channels (Android)
 export const createNotificationChannel = (channelData) =>
     notificationService.post('/notifications/channels', channelData);
 export const getAllChannels = () =>
     notificationService.get('/notifications/channels');
 export const getChannelById = (channelId) =>
     notificationService.get(`/notifications/channels/${channelId}`);
 export const updateChannel = (channelId, channelData) =>
     notificationService.put(`/notifications/channels/${channelId}`, channelData);
 export const deleteChannel = (channelId) =>
     notificationService.delete(`/notifications/channels/${channelId}`);

 // Notification Triggers & Automation
 export const createTrigger = (triggerData) =>
     notificationService.post('/notifications/triggers', triggerData);
 export const getAllTriggers = () =>
     notificationService.get('/notifications/triggers');
 export const getTriggerById = (triggerId) =>
     notificationService.get(`/notifications/triggers/${triggerId}`);
 export const updateTrigger = (triggerId, triggerData) =>
     notificationService.put(`/notifications/triggers/${triggerId}`, triggerData);
 export const deleteTrigger = (triggerId) =>
     notificationService.delete(`/notifications/triggers/${triggerId}`);
 export const enableTrigger = (triggerId) =>
     notificationService.patch(`/notifications/triggers/${triggerId}/enable`);
 export const disableTrigger = (triggerId) =>
     notificationService.patch(`/notifications/triggers/${triggerId}/disable`);

 // Notification Segments
 export const createSegment = (segmentData) =>
     notificationService.post('/notifications/segments', segmentData);
 export const getAllSegments = () =>
     notificationService.get('/notifications/segments');
 export const getSegmentById = (segmentId) =>
     notificationService.get(`/notifications/segments/${segmentId}`);
 export const updateSegment = (segmentId, segmentData) =>
     notificationService.put(`/notifications/segments/${segmentId}`, segmentData);
 export const deleteSegment = (segmentId) =>
     notificationService.delete(`/notifications/segments/${segmentId}`);
 export const sendToSegment = (segmentId, title, body, data = {}) =>
     notificationService.post(`/notifications/segments/${segmentId}/send`, {
         title,
         body,
         data
     });

 // A/B Testing
 export const createABTest = (testData) =>
     notificationService.post('/notifications/ab-tests', testData);
 export const getAllABTests = () =>
     notificationService.get('/notifications/ab-tests');
 export const getABTestById = (testId) =>
     notificationService.get(`/notifications/ab-tests/${testId}`);
 export const startABTest = (testId) =>
     notificationService.post(`/notifications/ab-tests/${testId}/start`);
 export const stopABTest = (testId) =>
     notificationService.post(`/notifications/ab-tests/${testId}/stop`);
 export const getABTestResults = (testId) =>
     notificationService.get(`/notifications/ab-tests/${testId}/results`);

 // Health & System Status
 export const getHealthStatus = () =>
     notificationService.get('/notifications/health');
 export const getSystemStatus = () =>
     notificationService.get('/notifications/system/status');
 export const getServiceMetrics = () =>
     notificationService.get('/notifications/system/metrics');

 // Webhook Management
 export const createWebhook = (webhookData) =>
     notificationService.post('/notifications/webhooks', webhookData);
 export const getAllWebhooks = () =>
     notificationService.get('/notifications/webhooks');
 export const getWebhookById = (webhookId) =>
     notificationService.get(`/notifications/webhooks/${webhookId}`);
 export const updateWebhook = (webhookId, webhookData) =>
     notificationService.put(`/notifications/webhooks/${webhookId}`, webhookData);
 export const deleteWebhook = (webhookId) =>
     notificationService.delete(`/notifications/webhooks/${webhookId}`);
 export const testWebhook = (webhookId) =>
     notificationService.post(`/notifications/webhooks/${webhookId}/test`);

 // API route handler for Next.js
 export default async function handler(req, res) {
     const { method, query, body, headers } = req;
     const { id, action, type, userId, templateId, campaignId, segmentId, testId, webhookId } = query;

     try {
         // Optional: Verify user authentication
         const token = headers.authorization?.replace('Bearer ', '');

         let response;

         switch (method) {
             case 'GET':
                 if (type === 'notifications' && userId) {
                     response = await getUserNotifications(userId, query);
                 } else if (type === 'notifications' && id) {
                     response = await getNotificationById(id);
                 } else if (type === 'notification-stats' && userId) {
                     response = await getUserNotificationStats(userId);
                 } else if (type === 'system-stats') {
                     response = await getSystemNotificationStats();
                 } else if (type === 'analytics') {
                     response = await getNotificationAnalytics(query);
                 } else if (type === 'delivery-stats') {
                     response = await getNotificationDeliveryStats(query.startDate, query.endDate);
                 } else if (type === 'user-topics' && userId) {
                     response = await getUserTopics(userId);
                 } else if (type === 'topics') {
                     response = await getAllTopics();
                 } else if (type === 'user-tokens' && userId) {
                     response = await getUserTokens(userId);
                 } else if (type === 'templates' && id) {
                     response = await getTemplateById(id);
                 } else if (type === 'templates') {
                     response = await getAllTemplates(query);
                 } else if (type === 'scheduled' && id) {
                     response = await getScheduledNotificationById(id);
                 } else if (type === 'scheduled') {
                     response = await getScheduledNotifications(query);
                 } else if (type === 'user-preferences' && userId) {
                     response = await getUserPreferences(userId);
                 } else if (type === 'default-preferences') {
                     response = await getDefaultPreferences();
                 } else if (type === 'push-settings' && userId) {
                     response = await getPushSettings(userId);
                 } else if (type === 'history') {
                     response = await getNotificationHistory(query);
                 } else if (type === 'logs') {
                     response = await getNotificationLogs(query);
                 } else if (type === 'failed') {
                     response = await getFailedNotifications(query);
                 } else if (type === 'campaigns' && id) {
                     response = await getCampaignById(id);
                 } else if (type === 'campaigns') {
                     response = await getAllCampaigns(query);
                 } else if (type === 'campaign-stats' && campaignId) {
                     response = await getCampaignStats(campaignId);
                 } else if (type === 'channels' && id) {
                     response = await getChannelById(id);
                 } else if (type === 'channels') {
                     response = await getAllChannels();
                 } else if (type === 'triggers' && id) {
                     response = await getTriggerById(id);
                 } else if (type === 'triggers') {
                     response = await getAllTriggers();
                 } else if (type === 'segments' && id) {
                     response = await getSegmentById(id);
                 } else if (type === 'segments') {
                     response = await getAllSegments();
                 } else if (type === 'ab-tests' && id) {
                     response = await getABTestById(id);
                 } else if (type === 'ab-tests') {
                     response = await getAllABTests();
                 } else if (type === 'ab-test-results' && testId) {
                     response = await getABTestResults(testId);
                 } else if (type === 'webhooks' && id) {
                     response = await getWebhookById(id);
                 } else if (type === 'webhooks') {
                     response = await getAllWebhooks();
                 } else if (type === 'health') {
                     response = await getHealthStatus();
                 } else if (type === 'system-status') {
                     response = await getSystemStatus();
                 } else if (type === 'metrics') {
                     response = await getServiceMetrics();
                 }
                 break;

             case 'POST':
                 if (type === 'send') {
                     response = await sendNotification(body);
                 } else if (type === 'send-multiple') {
                     response = await sendMultipleNotifications(body);
                 } else if (type === 'send-topic') {
                     response = await sendTopicNotification(body);
                 } else if (type === 'subscribe') {
                     response = await subscribeToTopic(body.tokens, body.topic);
                 } else if (type === 'unsubscribe') {
                     response = await unsubscribeFromTopic(body.tokens, body.topic);
                 } else if (type === 'topics') {
                     response = await createTopic(body);
                 } else if (type === 'tokens') {
                     response = await registerDeviceToken(body);
                 } else if (type === 'validate-token') {
                     response = await validateToken(body.token);
                 } else if (type === 'templates') {
                     response = await createTemplate(body);
                 } else if (type === 'template-send' && templateId) {
                     response = await sendTemplateNotification(templateId, body.recipients, body.variables);
                 } else if (type === 'schedule') {
                     response = await scheduleNotification(body);
                 } else if (type === 'rich') {
                     response = await sendRichNotification(body);
                 } else if (type === 'campaigns') {
                     response = await createCampaign(body);
                 } else if (type === 'campaign-start' && campaignId) {
                     response = await startCampaign(campaignId);
                 } else if (type === 'campaign-stop' && campaignId) {
                     response = await stopCampaign(campaignId);
                 } else if (type === 'channels') {
                     response = await createNotificationChannel(body);
                 } else if (type === 'triggers') {
                     response = await createTrigger(body);
                 } else if (type === 'segments') {
                     response = await createSegment(body);
                 } else if (type === 'segment-send' && segmentId) {
                     response = await sendToSegment(segmentId, body.title, body.body, body.data);
                 } else if (type === 'ab-tests') {
                     response = await createABTest(body);
                 } else if (type === 'ab-test-start' && testId) {
                     response = await startABTest(testId);
                 } else if (type === 'ab-test-stop' && testId) {
                     response = await stopABTest(testId);
                 } else if (type === 'webhooks') {
                     response = await createWebhook(body);
                 } else if (type === 'webhook-test' && webhookId) {
                     response = await testWebhook(webhookId);
                 } else if (type === 'retry' && id) {
                     response = await retryFailedNotification(id);
                 } else if (type === 'retry-all-failed') {
                     response = await retryAllFailedNotifications();
                 }
                 break;

             case 'PUT':
                 if (type === 'tokens' && id) {
                     response = await updateDeviceToken(id, body);
                 } else if (type === 'templates' && id) {
                     response = await updateTemplate(id, body);
                 } else if (type === 'scheduled' && id) {
                     response = await updateScheduledNotification(id, body);
                 } else if (type === 'user-preferences' && userId) {
                     response = await updateUserPreferences(userId, body);
                 } else if (type === 'default-preferences') {
                     response = await updateDefaultPreferences(body);
                 } else if (type === 'push-settings' && userId) {
                     response = await updatePushSettings(userId, body);
                 } else if (type === 'campaigns' && id) {
                     response = await updateCampaign(id, body);
                 } else if (type === 'channels' && id) {
                     response = await updateChannel(id, body);
                 } else if (type === 'triggers' && id) {
                     response = await updateTrigger(id, body);
                 } else if (type === 'segments' && id) {
                     response = await updateSegment(id, body);
                 } else if (type === 'webhooks' && id) {
                     response = await updateWebhook(id, body);
                 }
                 break;

             case 'PATCH':
                 if (type === 'notifications' && id && action === 'read') {
                     response = await markNotificationAsRead(id);
                 } else if (type === 'notifications' && userId && action === 'read-all') {
                     response = await markAllNotificationsAsRead(userId);
                 } else if (type === 'push-enable' && userId) {
                     response = await enablePushNotifications(userId, body.deviceToken);
                 } else if (type === 'push-disable' && userId) {
                     response = await disablePushNotifications(userId);
                 } else if (type === 'triggers' && id && action === 'enable') {
                     response = await enableTrigger(id);
                 } else if (type === 'triggers' && id && action === 'disable') {
                     response = await disableTrigger(id);
                 }
                 break;

             case 'DELETE':
                 if (type === 'notifications' && id) {
                     response = await deleteNotification(id);
                 } else if (type === 'notifications' && userId && action === 'all') {
                     response = await deleteAllUserNotifications(userId);
                 } else if (type === 'topics' && id) {
                     response = await deleteTopic(id);
                 } else if (type === 'tokens' && id) {
                     response = await deleteDeviceToken(id);
                 } else if (type === 'templates' && id) {
                     response = await deleteTemplate(id);
                 } else if (type === 'scheduled' && id) {
                     response = await cancelScheduledNotification(id);
                 } else if (type === 'campaigns' && id) {
                     response = await deleteCampaign(id);
                 } else if (type === 'channels' && id) {
                     response = await deleteChannel(id);
                 } else if (type === 'triggers' && id) {
                     response = await deleteTrigger(id);
                 } else if (type === 'segments' && id) {
                     response = await deleteSegment(id);
                 } else if (type === 'webhooks' && id) {
                     response = await deleteWebhook(id);
                 }
                 break;

             default:
                 res.status(405).json({ error: 'Method not allowed' });
                 return;
         }

         res.status(200).json(response?.data || response);
     } catch (error) {
         console.error('Notification Service Error:', error);
         res.status(error.response?.status || 500).json({
             error: error.response?.data?.error || error.message
         });
     }
 }
