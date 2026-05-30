import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
const pool = new Pool({ connectionString: process.env['DATABASE_URL'], max: 20 });
pool.on('error', (err) => console.error('DB error:', err));
export default pool;
