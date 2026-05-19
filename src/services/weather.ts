import { locations, requestsLog, weatherRecords } from '../db/schema.js';
import db from '../db/index.js';
import { eq } from 'drizzle-orm';

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

    //save location, request and weather data to the database

    const new_location = await db.insert(locations).values({
        query: city,
        location: city, // This should be the actual location name from the weather API
        country: 'Unknown' // This should be the actual country name from the weather API
    }).onConflictDoNothing().returning();

    const locationId = new_location[0]?.id ?? (
        await db.select().from(locations).where(eq(locations.query, city)).limit(1)
    )[0]?.id;

    if (!locationId) {
        throw new Error('Unable to determine location ID');
    }

    // use DB column names as defined in the requestsLog schema
    const new_request = await db.insert(requestsLog).values({
        locationId: locationId,
        dateFrom: new Date(date_from),
        dateTo: new Date(date_to),
    }).returning();

    const requestId = new_request[0]?.id;
    if (!requestId) throw new Error('Failed to create request log');

    //call openweather api to get weather data for the city and date range
    const weatherData = await fetchWeatherData(city, date_from, date_to);

    const result = [];
    for (let date = new Date(date_from); date <= new Date(date_to); date.setDate(date.getDate() + 1)) {
        const new_record = {
            locationId: locationId, 
            requestId: requestId, 
            date: new Date(date), 
            tempC: weatherData.tempC, 
            feelsLikeC: weatherData.feelsLikeC, 
            humidity: weatherData.humidity, 
            windSpeedMs: weatherData.windSpeedMs, 
            precipProbability: weatherData.precipProbability, 
            uvIndex: weatherData.uvIndex, 
            aqi: weatherData.aqi 
        };
        const record = await db.insert(weatherRecords).values(new_record).returning();
        result.push(record[0]);
    }
    return result;
};

async function fetchWeatherData(city: string, date_from: string, date_to: string) {
    //call geocoding api to get lat and lon for the city

    const lat = 0; // This should be the actual latitude from the geocoding API
    const lon = 0; // This should be the actual longitude from the geocoding API

    // This function should call the OpenWeather API to fetch weather data for the given city and date range
    // For the purpose of this example, we will return dummy data
    return {
        tempC: 25,
        feelsLikeC: 27,
        humidity: 60,
        windSpeedMs: 5,
        precipProbability: 0.2,
        uvIndex: 5,
        aqi: 50
    };
};