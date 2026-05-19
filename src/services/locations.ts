import { locations } from '../db/schema.js';
import db from '../db/index.js';
import { eq } from 'drizzle-orm';

export async function getAllLocations() {
    return await db.select().from(locations)
}

export async function getLocationById(id: number) {
    const res = await db.select().from(locations).where(eq(locations.id, id)).limit(1)
    return res[0] || null;
}
