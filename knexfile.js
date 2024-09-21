// knexfile.js
module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "pengiriman_barang",
    },
  },
  test: {
    client: "mysql2",
    connection: {
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "pengiriman_barang",
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  production: {
    client: "mysql2",
    connection: process.env.DATABASE_URL,
  },
};
