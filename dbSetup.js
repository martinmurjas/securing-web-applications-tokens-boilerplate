// Imports
import pkg from 'pg';
import * as dotenv from "dotenv";

const { Client } = pkg;
dotenv.config({});
const dbName = 'oauth-boilerplate'

const setupDatabase = async () => {

  // Setup the postgres client informtion including grabbing user from .env file
  const client = new Client({
    host: "localhost",
    dialect: "postgres",
    user: process.env.DB_USER,
    port: 5432
  })

  await client.connect()

  // Runs query to check if the databse exists
  const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);

  // If database doesn't exist, creates the database, otherwise continue
  if (res.rowCount === 0) {
      console.log(`${dbName} database not found, creating it.`);
      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log(`created database ${dbName}`);
  } else {
      console.log(`${dbName} database exists.`);
  }

  await client.end()

}

setupDatabase();





