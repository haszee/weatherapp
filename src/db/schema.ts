import {
  pgTable, serial, text, decimal, smallint, integer,
  date, timestamp, varchar, uniqueIndex, index, check
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';


export const locations = pgTable('locations',{
    id:         serial('id').primaryKey(),
    query:      text('query').notNull(),
    location:   text('location').notNull(),
    country:    text('country').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true,mode: 'date' }).notNull().defaultNow(),
}, (t) => ({
    queryUnique: uniqueIndex('idx_locations_query').on(sql`LOWER(${t.query})`),
}));

export const weatherRecords = pgTable('weather_records', {
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

export const requestsLog = pgTable('requests_log', {
    id:        serial('id').primaryKey(),
    locationId:    integer('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    dateFrom:      date('date_from').notNull(),
    dateTo:        date('date_to').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date'}).defaultNow(),
}, (t) => ({
    dateRangeCheck: check('date_range_check',sql`${t.dateFrom} <= ${t.dateTo}`),
    createdIdx: index('idx_requests_created').on(t.createdAt)
}));

export const exportsLog = pgTable('exports_log', {
  id:        serial('id').primaryKey(),
  format:    varchar('format', { length: 10 }).notNull(),
  recordIds: integer('record_ids').array(),
  rowCount:  integer('row_count'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date'}).defaultNow(),
}, (t) => ({
    createdIdx: index('idx_exports_created').on(t.createdAt)
}));