// api/map/services.js
import { getFirestore, collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { geohashForLocation, geohashQueryBounds } from 'geofire-common';
import initFirebase from '@/lib/firebase/initFirebase';

initFirebase();
const db = getFirestore();

export default async function handler(req, res) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                if (req.query.nearby) {
                    // Get services nearby specific coordinates
                    await getNearbyServices(req, res);
                } else if (req.query.serviceId) {
                    // Get specific service details
                    await getServiceDetails(req, res);
                } else {
                    // General search with filters
                    await searchServices(req, res);
                }
                break;

            case 'POST':
                // Save a location for user
                await saveLocation(req, res);
                break;

            case 'DELETE':
                // Delete saved location
                await deleteSavedLocation(req, res);
                break;

            default:
                res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
                res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get services nearby specific coordinates
async function getNearbyServices(req, res) {
    const { lat, lng, radius = 10, category, limit = 20, startAfter: startAfterDoc } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        const center = [parseFloat(lat), parseFloat(lng)];
        const radiusInM = parseFloat(radius) * 1000;

        // Each geohash covers a rectangular area, so we need to query multiple geohashes
        const bounds = geohashQueryBounds(center, radiusInM);
        const promises = [];

        const servicesRef = collection(db, 'services');

        for (const b of bounds) {
            const q = query(
                servicesRef,
                orderBy('geohash'),
                where('geohash', '>=', b[0]),
                where('geohash', '<=', b[1])
            );

            promises.push(getDocs(q));
        }

        // Collect all the query results
        const snapshots = await Promise.all(promises);
        const matchingDocs = [];

        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const service = doc.data();
                const serviceLat = service.location?.lat;
                const serviceLng = service.location?.lng;

                if (serviceLat && serviceLng) {
                    // Calculate distance between service and center
                    const distance = calculateDistance(center[0], center[1], serviceLat, serviceLng);

                    if (distance <= radiusInM) {
                        matchingDocs.push({
                            id: doc.id,
                            ...service,
                            distance: (distance / 1000).toFixed(1) // Convert to km
                        });
                    }
                }
            }
        }

        // Filter by category if specified
        let filteredServices = matchingDocs;
        if (category) {
            filteredServices = matchingDocs.filter(service =>
                service.category === category || service.subcategory === category
            );
        }

        // Sort by distance and apply limit
        filteredServices.sort((a, b) => a.distance - b.distance);
        const limitedServices = filteredServices.slice(0, parseInt(limit));

        res.status(200).json(limitedServices);
    } catch (error) {
        console.error('Error getting nearby services:', error);
        res.status(500).json({ error: 'Failed to get nearby services' });
    }
}

// Search services with various filters
async function searchServices(req, res) {
    const { q, category, minPrice, maxPrice, sortBy = 'createdAt', limit = 20, startAfter: startAfterDoc } = req.query;

    try {
        let servicesQuery = collection(db, 'services');
        const constraints = [];

        if (q) {
            constraints.push(where('title', '>=', q));
            constraints.push(where('title', '<=', q + '\uf8ff'));
        }

        if (category) {
            constraints.push(where('category', '==', category));
        }

        if (minPrice) {
            constraints.push(where('price', '>=', parseFloat(minPrice)));
        }

        if (maxPrice) {
            constraints.push(where('price', '<=', parseFloat(maxPrice)));
        }

        constraints.push(orderBy(sortBy, 'desc'));
        constraints.push(limit(parseInt(limit)));

        const qry = query(servicesQuery, ...constraints);
        const querySnapshot = await getDocs(qry);

        const services = [];
        querySnapshot.forEach((doc) => {
            services.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json(services);
    } catch (error) {
        console.error('Error searching services:', error);
        res.status(500).json({ error: 'Failed to search services' });
    }
}

// Get specific service details
async function getServiceDetails(req, res) {
    const { serviceId } = req.query;

    if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
    }

    try {
        const serviceRef = doc(db, 'services', serviceId);
        const serviceDoc = await getDoc(serviceRef);

        if (!serviceDoc.exists()) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.status(200).json({
            id: serviceDoc.id,
            ...serviceDoc.data()
        });
    } catch (error) {
        console.error('Error getting service details:', error);
        res.status(500).json({ error: 'Failed to get service details' });
    }
}

// Save location for user
async function saveLocation(req, res) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, address, lat, lng, type = 'saved' } = req.body;

    if (!name || !address || !lat || !lng) {
        return res.status(400).json({ error: 'Name, address, and coordinates are required' });
    }

    try {
        const locationsRef = collection(db, 'users', user.uid, 'savedLocations');
        const newLocationRef = doc(locationsRef);

        await setDoc(newLocationRef, {
            name,
            address,
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            type,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({
            id: newLocationRef.id,
            name,
            address,
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            type
        });
    } catch (error) {
        console.error('Error saving location:', error);
        res.status(500).json({ error: 'Failed to save location' });
    }
}

// Delete saved location
async function deleteSavedLocation(req, res) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { locationId } = req.query;

    if (!locationId) {
        return res.status(400).json({ error: 'Location ID is required' });
    }

    try {
        const locationRef = doc(db, 'users', user.uid, 'savedLocations', locationId);
        await deleteDoc(locationRef);

        res.status(200).json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({ error: 'Failed to delete location' });
    }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in meters

    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}