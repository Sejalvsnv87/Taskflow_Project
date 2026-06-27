import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  await connection.query(schema);
  await connection.end();

  console.log('Database initialized successfully!');
}

initDatabase().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
