import {Router} from 'express';
import type { Request, Response } from 'express';
import { getAllweatherRecords, getWeatherRecordById  } from '../services/weather.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const weatherRecords = await getAllweatherRecords();
        res.json(weatherRecords);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather records' });
    }

})

router.get('/:id', async (req: Request, res: Response) => {
    if (typeof req.params.id !== 'string') {
        return res.status(400).json({ error: 'Weather record ID is required' });
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid weather record ID' });
    } 

    try {
        const weatherRecord = await getWeatherRecordById(id);
        if (!weatherRecord) {
            return res.status(404).json({ error: 'Weather record not found' });
        }
        res.json(weatherRecord);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather record' });
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to create weather record' });
    }
})

export default router;