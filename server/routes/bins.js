const express = require('express');
const router = express.Router();
const BinLocation = require('../models/BinLocation');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// GET /bins/nearby - Fetch nearby bins
router.get('/nearby', async (req, res) => {
    const { lat, lng, radius = 5 } = req.query; // radius in km

    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng are required' });
    }

    try {
        // Simple distance calculation (not using geospatial index for simplicity)
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        // Approximate: 1 degree = 111km
        const latRange = radiusKm / 111;
        const lngRange = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));

        const bins = await BinLocation.find({
            lat: { $gte: latNum - latRange, $lte: latNum + latRange },
            lng: { $gte: lngNum - lngRange, $lte: lngNum + lngRange }
        });

        // Calculate actual distance and sort
        const binsWithDistance = bins.map(bin => {
            const dLat = (bin.lat - latNum) * 111;
            const dLng = (bin.lng - lngNum) * 111 * Math.cos(latNum * Math.PI / 180);
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);
            return { ...bin.toObject(), distance: Math.round(distance * 100) / 100 };
        }).filter(bin => bin.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);

        res.json(binsWithDistance);
    } catch (error) {
        console.error('Nearby Bins Error:', error);
        res.status(500).json({ error: 'Failed to fetch bins' });
    }
});

// POST /bins/report - Report a full/broken bin
router.post('/report', authMiddleware, async (req, res) => {
    const { binId, isFull, isBroken, reportPhoto } = req.body;

    try {
        const bin = await BinLocation.findByIdAndUpdate(
            binId,
            {
                isFull: isFull || false,
                isBroken: isBroken || false,
                reportedBy: req.user._id,
                reportPhoto,
                lastUpdated: new Date()
            },
            { new: true }
        );

        if (!bin) return res.status(404).json({ error: 'Bin not found' });
        res.json(bin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to report bin' });
    }
});

// POST /bins - Admin: add new bin
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    const { lat, lng, binType, address } = req.body;

    try {
        const bin = new BinLocation({
            binId: `BIN-${Date.now()}`,
            lat,
            lng,
            binType,
            address
        });
        await bin.save();
        res.status(201).json(bin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create bin' });
    }
});

// PUT /bins/:id - Update bin status
router.put('/:id', authMiddleware, async (req, res) => {
    const { isFull, isBroken, binType, address } = req.body;

    try {
        const bin = await BinLocation.findByIdAndUpdate(
            req.params.id,
            { isFull, isBroken, binType, address, lastUpdated: new Date() },
            { new: true }
        );

        if (!bin) return res.status(404).json({ error: 'Bin not found' });
        res.json(bin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update bin' });
    }
});

// GET /bins - Get all bins (for map)
router.get('/', async (req, res) => {
    try {
        const bins = await BinLocation.find();
        res.json(bins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bins' });
    }
});

module.exports = router;
