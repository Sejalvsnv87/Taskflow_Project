import fs from 'fs';
import path from 'path';
import { createDB } from 'mysql-memory-server';
import mysql from 'mysql2/promise';

async function startDevServer() {
  console.log('Starting ephemeral MySQL for local development...');

  const db = await createDB({
    version: '8.0.x',
    dbName: 'taskflow',
    username: 'root',
  });

  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(db.port);
  process.env.DB_USER = db.username;
  process.env.DB_PASSWORD = '';
  process.env.DB_NAME = db.dbName;

  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: db.port,
    user: db.username,
    password: '',
    database: db.dbName,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  const schema = fs
    .readFileSync(schemaPath, 'utf-8')
    .replace(/CREATE DATABASE IF NOT EXISTS taskflow;\s*/i, '')
    .replace(/USE taskflow;\s*/i, '');

  await connection.query(schema);
  await connection.end();

  console.log(`MySQL ready on port ${db.port} (database: ${db.dbName})`);

  process.on('SIGINT', async () => {
    await db.stop();
    process.exit(0);
  });

  await import('./index');
}

startDevServer().catch((err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
