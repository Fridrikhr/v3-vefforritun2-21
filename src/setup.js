import { promises } from 'fs';
import { readFile } from 'fs/promises';
import faker from 'faker';
import dotenv from 'dotenv';
import pg from 'pg';
import { query, insert } from './db.js';

dotenv.config();

const {
  DATABASE_URL: connectionString,
} = process.env;

const pool = new pg.Pool({ connectionString });

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

async function initialize() {
  try {
    const createTable = await readFile('./sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Table made');
  } catch (e) {
    console.error(e.message);
  }

  for (let i = 0; i < 510; i++) {
    const data = await {
      name: faker.name.findName(),
      nationalId: faker.random.number(),
      comment: faker.lorem.sentence(),
      anonymous: false,
    };

    try {
      console.log(data);
      await insert(data);
    } catch (e) {
      console.error(e.message);
    }
  }
  console.log('faker added');
}

initialize().catch((err) => {
  console.error(err);
});

/* Fall til að athuga hvort faker virki
async function select() {
  const client = await pool.connect();

  try {
    const res = await client.query('SELECT * FROM signatures;');
    console.log(res.rows);
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }
  return [];
}

await select();
*/
