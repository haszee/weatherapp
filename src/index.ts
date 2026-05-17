import db from './db/index.js';
import express from 'express'
import cors from 'cors'
import 'dotenv/config';
import { sql } from 'drizzle-orm';

const app = express();

app.use(express.json());

app.use(cors());

async function checkDatabaseConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

const port = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Exiting due to database connection failure.');
      process.exit(1);
    }
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize the database:', error);
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

startServer().catch(console.error)

