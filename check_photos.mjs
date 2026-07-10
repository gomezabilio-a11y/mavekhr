import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, firstName, photoUrl FROM employees LIMIT 20');
rows.forEach(r => console.log(r.id, r.firstName, JSON.stringify(r.photoUrl)));
await conn.end();
