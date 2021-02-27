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

  await query('DROP TABLE IF EXISTS signatures');

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
      nationalId: Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000),
      comment: (Math.random() > 0.4) ? faker.lorem.sentence() :"",
      anonymous: Math.random() > 0.4 ? true : false,
    };

    try {
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
