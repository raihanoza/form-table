import { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pengiriman_barang',
    },
    migrations: {
      directory: 'knex/migrations',
    },
    seeds: {
      directory: 'knex/seeds',
    },
  },
  test: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pengiriman_barang',
    },
    migrations: {
      directory: 'knex/migrations',
    },
  },
  production: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pengiriman_barang',
    },
    migrations: {
      directory: 'knex/migrations',
    },
  },
};

export default config;
