import {Router} from 'express';
import type { Request, Response } from 'express';
import { getAllLocations, getLocationById } from '../services/locations.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const locations = await getAllLocations();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    if (typeof req.params.id !== 'string') {
        return res.status(400).json({ error: 'Location ID is required' });
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location ID' });
    } 

    try {
        const location = await getLocationById(id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch location' });
    }
});

export default router;