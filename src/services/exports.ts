import db from '../db/index.js';
import { weatherRecords, exportsLog, locations } from '../db/schema.js';
import { inArray, and, between, eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface ExportFilters {
  format: 'csv' | 'pdf';
  date_from?: string;
  date_to?: string;
  location_id?: number;
}

interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}

export async function exportWeatherData(filters: ExportFilters): Promise<ExportResult> {
  const conditions = [];

  if (filters.date_from && filters.date_to) {
    conditions.push(between(weatherRecords.date, filters.date_from, filters.date_to));
  }

  if (filters.location_id) {
    conditions.push(eq(weatherRecords.locationId, filters.location_id));
  }

  const rows = await db
    .select({
      id: weatherRecords.id,
      date: weatherRecords.date,
      location: locations.location,
      country: locations.country,
      tempC: weatherRecords.tempC,
      feelsLikeC: weatherRecords.feelsLikeC,
      humidity: weatherRecords.humidity,
      windSpeedMs: weatherRecords.windSpeedMs,
      precipProbability: weatherRecords.precipProbability,
      uvIndex: weatherRecords.uvIndex,
      aqi: weatherRecords.aqi,
    })
    .from(weatherRecords)
    .innerJoin(locations, eq(weatherRecords.locationId, locations.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const recordIds = rows.map(r => r.id);
  const rowCount = rows.length;

  let buffer: Buffer;
  let filename: string;
  let mimeType: string;

  if (filters.format === 'csv') {
    buffer = Buffer.from(generateCSV(rows), 'utf-8');
    filename = 'weather-export.csv';
    mimeType = 'text/csv';
  } else {
    buffer = await generatePDF(rows);
    filename = 'weather-export.pdf';
    mimeType = 'application/pdf';
  }

  await db.insert(exportsLog).values({
    format: filters.format,
    recordIds,
    rowCount,
  });

  return { buffer, filename, mimeType, rowCount };
}

function generateCSV(rows: any[]): string {
  const headers = [
    'date', 'location', 'country', 'temp_c', 'feels_like_c',
    'humidity', 'wind_speed_ms', 'precip_probability', 'uv_index', 'aqi'
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push([
      row.date,
      `"${row.location}"`,
      `"${row.country}"`,
      row.tempC,
      row.feelsLikeC,
      row.humidity,
      row.windSpeedMs,
      row.precipProbability,
      row.uvIndex ?? '',
      row.aqi ?? '',
    ].join(','));
  }

  return lines.join('\n');
}

async function generatePDF(rows: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Weather Export', { align: 'center' });
    doc.moveDown();

    for (const row of rows) {
      doc
        .fontSize(12)
        .text(`${row.date} — ${row.location}, ${row.country}`);
      doc
        .fontSize(10)
        .text(`Temp: ${row.tempC}°C  |  Feels Like: ${row.feelsLikeC}°C  |  Humidity: ${row.humidity}%`)
        .text(`Wind: ${row.windSpeedMs} m/s  |  Precip: ${(Number(row.precipProbability) * 100).toFixed(0)}%  |  AQI: ${row.aqi ?? 'N/A'}`);
      doc.moveDown(0.5);
    }

    doc.end();
  });
}