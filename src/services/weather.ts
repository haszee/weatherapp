import { locations, requestsLog, weatherRecords } from '../db/schema.js';
import db from '../db/index.js';
import { eq } from 'drizzle-orm';

const openweatherApiKey = process.env.OPENWEATHER_API_KEY;
if (!openweatherApiKey) {
    throw new Error('OPENWEATHER_API_KEY is not set');
}

const avg = (arr: any[], key: string) =>
    arr.reduce((sum, entry) => sum + entry[key], 0) / arr.length;


export async function getAllweatherRecords() {
    return await db.select().from(weatherRecords)
}

export async function getWeatherRecordById(id: number) {
    const res = await db.select().from(weatherRecords).where(eq(weatherRecords.id, id)).limit(1)
    return res[0] || null;
}

/**
 * 
 * @param data export const weatherRecords = pgTable('weather_records', {
     id:            serial('id').primaryKey(),
     locationId:    integer('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
     requestId:     integer('request_id').notNull().references(() => requestsLog.id, { onDelete: 'cascade' }),
     date:          date('date'),
     tempC:         decimal('temp_c', { precision: 5, scale: 2 }),
     feelsLikeC:    decimal('feels_like_c', { precision: 5, scale: 2 }),
     humidity:      smallint('humidity'),
     windSpeedMs:   decimal('wind_speed_ms', { precision: 6, scale: 2 }),
     precipProbability: decimal('precip_probability', { precision: 5, scale: 2 }),
     uvIndex:       decimal('uv_index', { precision: 4, scale: 2 }),
     aqi:           smallint('aqi'),
     createdAt: timestamp('created_at', { withTimezone: true, mode: 'date'}).defaultNow(),
     updatedAt:     timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
 }, (t) => ({
     locationDateUnique: uniqueIndex('idx_records_location_date').on(t.locationId, t.date),
     createdIdx: index('idx_records_created').on(t.createdAt)
 }));
 */
export async function createWeatherRecord(data: { city: string, date_from: string, date_to: string }) {
    const { city, date_from, date_to } = data;

    const geoCode = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${openweatherApiKey}`);
    const geoData = await geoCode.json();

    const lat = geoData[0]?.lat || null; 
    const lon = geoData[0]?.lon || null; 
    const locationName = geoData[0]?.name || city;
    const country = geoData[0]?.country || 'Unknown';

    if (!lat || !lon) {
        throw new Error('Unable to determine location coordinates');
    }

    const new_location = await db.insert(locations).values({
        query: city,
        location: locationName, 
        country: country 
    }).onConflictDoNothing().returning();

    const locationId = new_location[0]?.id ?? (
        await db.select().from(locations).where(eq(locations.query, city)).limit(1)
    )[0]?.id;

    if (!locationId) {
        throw new Error('Unable to determine location ID');
    }

    const new_request = await db.insert(requestsLog).values({
        locationId: locationId,
        dateFrom: new Date(date_from).toISOString().split('T')[0]!,
        dateTo: new Date(date_to).toISOString().split('T')[0]!
    }).returning();

    const requestId = new_request[0]?.id;
    if (!requestId) throw new Error('Failed to create request log');

    const weatherData = await fetchWeatherData(city, date_from, date_to, lat, lon);

    const result = [];
    for (let date = new Date(date_from); date <= new Date(date_to); date.setDate(date.getDate() + 1)) {
        const dayData = weatherData.find((d: any) => d.date === date.toISOString().
        split('T')[0]!);
        if (!dayData) {
            result.push(null);
            continue;
        }
        const new_record = {
            locationId: locationId, 
            requestId: requestId, 
            date: date.toISOString().split('T')[0], 
            tempC: dayData.tempC?.toString() ?? null, 
            feelsLikeC: dayData.feelsLikeC?.toString() ?? null, 
            humidity: dayData.humidity ?? null, 
            windSpeedMs: dayData.windSpeedMs?.toString() ?? null, 
            precipProbability: dayData.precipProbability?.toString() ?? null, 
            uvIndex: null, 
            aqi: dayData.aqi ?? null
        };
        const record = await db.insert(weatherRecords).values(new_record).onConflictDoNothing().returning();
        result.push(record[0]); 
    };
    return result;
};

async function fetchWeatherData(city: string, date_from: string, date_to: string, lat: number, lon: number) {

    const weatherResponse = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}&units=metric`);
    const weatherData = await weatherResponse.json();

    const aqiResponse = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}`);
    const aqiData = await aqiResponse.json();

    // allow undefined values for keys that may not be present
    const aqiMap: Record<string, number | null > = {};
    for (let date = new Date(date_from); date <= new Date(date_to); date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]!;
        const dailyAqiData = aqiData.list.filter((entry: any) => 
            new Date(entry.dt * 1000).toISOString().split('T')[0] === dateStr
        );

        aqiMap[dateStr] = dailyAqiData.length > 0 
            ? Math.round(avg(dailyAqiData.map((e: any) => e.main), 'aqi'))
            : null;
    }
    
    // Get the daily data in 3 hour intervals then average it for each date
    const records = [];
    for (let date = new Date(date_from); date <= new Date(date_to); date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]!;
        const dailyWeatherData = weatherData.list.filter((entry: any) => entry.dt_txt.startsWith(dateStr));

        if (dailyWeatherData.length > 0) {
            records.push({
                date: dateStr,
                tempC: avg(dailyWeatherData.map((e: any) => e.main), 'temp'),
                feelsLikeC: avg(dailyWeatherData.map((e: any) => e.main), 'feels_like'),
                humidity: Math.round(avg(dailyWeatherData.map((e: any) => e.main), 'humidity')),
                windSpeedMs: avg(dailyWeatherData.map((e: any) => e.wind), 'speed'),
                precipProbability: avg(dailyWeatherData, 'pop'),
                uvIndex: null, // OpenWeatherMap's free API does not provide UV index in the forecast data
                aqi: aqiMap[dateStr] ?? null
            });
        }

    }

    return records;
};