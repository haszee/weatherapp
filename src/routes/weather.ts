import {Router} from 'express';
import type { Request, Response } from 'express';
import { getAllweatherRecords, getWeatherRecordById, createWeatherRecord  } from '../services/weather.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const weatherRecords = await getAllweatherRecords();
        res.json(weatherRecords);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather records' });
    }

})

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
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
    const { city, date_from, date_to } = req.body;

    if (!city || !date_from || !date_to) {
        return res.status(400).json({ error: 'city, date_from and date_to are required' });
    }

    if (typeof city !== 'string' || typeof date_from !== 'string' || typeof date_to !== 'string') {
        return res.status(400).json({ error: 'city, date_from and date_to must be strings' });
    }

    if (new Date(date_from) > new Date(date_to)) {
        return res.status(400).json({ error: 'date_from cannot be after date_to' });
    }

    if (new Date(date_from) - new Date(date_to) > 5 * 24 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Date range cannot be more than 5 days' });
    }

    try {
        const weatherRecord = await createWeatherRecord(req.body);
        res.status(201).json(weatherRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create weather record' });
    }
})

export default router;