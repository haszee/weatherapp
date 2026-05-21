I# weatherapp-backend

Backend API for weather data collection, storage, and export. The service is built with Express, TypeScript, Drizzle ORM, and PostgreSQL, and it uses the OpenWeatherMap API to fetch forecast and air quality data.

## Features

- Health check endpoint
- Location lookup endpoints
- Weather record endpoints
- CSV and PDF export of weather data
- PostgreSQL persistence through Drizzle ORM
- Database connection validation on startup

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- OpenWeatherMap API
- PDFKit for PDF exports

## Prerequisites

- Node.js 18+ recommended
- PostgreSQL database
- OpenWeatherMap API key

## Environment Variables

Create a `.env` file in the project root with:

```env
DATABASE_URL=your_postgres_connection_string
OPENWEATHER_API_KEY=your_openweather_api_key
PORT=3001
```

## Installation

```bash
npm install
```

## Development

Run the server in watch mode:

```bash
npm run dev
```

## Build

Compile the TypeScript project:

```bash
npm run build
```

## API Endpoints

### Health Check

`GET /health`

Returns the server status.

### Locations

`GET /api/locations`

Returns all saved locations.

`GET /api/locations/:id`

Returns a single location by ID.

### Weather

`GET /api/weather`

Returns all weather records.

`GET /api/weather/:id`

Returns a single weather record by ID.

`POST /api/weather`

Creates weather records for a city and date range.

Request body:

```json
{
  "city": "London",
  "date_from": "2026-05-01",
  "date_to": "2026-05-05"
}
```

Validation rules:

- `city`, `date_from`, and `date_to` are required
- all fields must be strings
- `date_from` cannot be after `date_to`
- the date range cannot exceed 5 days

### Exports

`GET /api/exports?format=csv`

or

`GET /api/exports?format=pdf`

Optional query parameters:

- `date_from`
- `date_to`
- `location_id`

Example:

```bash
/api/exports?format=csv&date_from=2026-05-01&date_to=2026-05-05&location_id=1
```

Supported export formats:

- `csv`
- `pdf`

## Database

The database schema includes:

- `locations`
- `weather_records`
- `requests_log`
- `exports_log`

Drizzle schema and migrations are located in the `src/db` and `drizzle/` directories.

## Notes

- The server checks database connectivity before starting.
- Weather creation uses OpenWeatherMap geocoding, forecast, and air pollution endpoints.
- Export requests are logged in the database.
```