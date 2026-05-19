import { weatherRecords } from '../db/schema.js';
import db from '../db/index.js';
import { eq } from 'drizzle-orm';

export async function getAllweatherRecords() {
    return await db.select().from(weatherRecords)
}

export async function getWeatherRecordById(id: number) {
    const res = await db.select().from(weatherRecords).where(eq(weatherRecords.id, id)).limit(1)
    return res[0] || null;
}

export async function createWeatherRecord(data: { temperature: number; humidity: number; description: string }) {
    const [newRecord] = await db.insert(weatherRecords).values(data).returning();
    return newRecord;
}