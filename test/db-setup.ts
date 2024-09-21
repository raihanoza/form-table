// src/db-setup.ts
import knex from "knex";
import knexfile from "../knexfile";

// Menentukan lingkungan yang sedang digunakan (development, production, dll.)
const environment = process.env.NODE_ENV || "development";

// Mengambil konfigurasi Knex berdasarkan lingkungan
const config = knexfile[environment];

// Membuat instance Knex dengan konfigurasi yang sesuai
const db = knex(config);

// Menyediakan ekspor default untuk instance db
export default db;
