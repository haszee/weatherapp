import { Router } from 'express';
import type { Request, Response } from 'express';
import { exportWeatherData } from '../services/exports.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const { format, date_from, date_to, location_id } = req.query;

    if (!format || typeof format !== 'string') {
        res.status(400).json({ error: 'format query param is required (csv or pdf)' });
        return;
    }

    if (format !== 'csv' && format !== 'pdf') {
        res.status(400).json({ error: 'format must be csv or pdf' });
        return;
    }

    if (date_from && typeof date_from !== 'string') {
        res.status(400).json({ error: 'date_from must be a string' });
        return;
    }

    if (date_to && typeof date_to !== 'string') {
        res.status(400).json({ error: 'date_to must be a string' });
        return;
    }

    const parsedLocationId = location_id
        ? parseInt(location_id as string, 10)
        : undefined;

    if (location_id && isNaN(parsedLocationId!)) {
        res.status(400).json({ error: 'location_id must be a valid number' });
        return;
    }



    try {
        const result = await exportWeatherData({
            format: format as 'csv' | 'pdf',
            ...(date_from && { date_from: date_from as string }),
            ...(date_to && { date_to: date_to as string }),
            ...(parsedLocationId && { location_id: parsedLocationId }),
        });
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.status(200).send(result.buffer);
    } catch (error) {
    console.error('Export failed:', error);
        res.status(500).json({ error: 'Export failed' });
    }

});

export default router;