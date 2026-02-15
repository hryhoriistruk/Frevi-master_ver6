// api/map/geocode.js
import axios from 'axios';

export default async function handler(req, res) {
    const { method, query } = req;

    try {
        switch (method) {
            case 'GET':
                if (query.lat && query.lng) {
                    // Reverse geocoding - get address from coordinates
                    await reverseGeocode(req, res);
                } else if (query.query) {
                    // Address autocomplete
                    await addressAutocomplete(req, res);
                } else {
                    res.status(400).json({ error: 'Missing required parameters' });
                }
                break;

            default:
                res.setHeader('Allow', ['GET']);
                res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Geocoding API Error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Reverse geocoding - get address from coordinates
async function reverseGeocode(req, res) {
    const { lat, lng } = req.query;

    try {
        // Using Nominatim (OpenStreetMap) for geocoding
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: parseFloat(lat),
                lon: parseFloat(lng),
                format: 'json',
                addressdetails: 1,
                'accept-language': 'en'
            },
            headers: {
                'User-Agent': 'Frevi App (https://yourdomain.com)'
            }
        });

        const result = response.data;
        res.status(200).json({
            address: result.display_name,
            components: result.address,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        });
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({ error: 'Failed to reverse geocode' });
    }
}

// Address autocomplete
async function addressAutocomplete(req, res) {
    const { query, limit = 5 } = req.query;

    try {
        // Using Nominatim (OpenStreetMap) for search
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: parseInt(limit),
                'accept-language': 'en'
            },
            headers: {
                'User-Agent': 'Frevi App (https://yourdomain.com)'
            }
        });

        const results = response.data.map(item => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.address
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Address autocomplete error:', error);
        res.status(500).json({ error: 'Failed to get address suggestions' });
    }
}