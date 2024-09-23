import knex from 'knex';
import config from './knexfile'; // Assuming knexfile.js has the correct configuration

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]); // Ensure this is the correct environment config

export default db;
