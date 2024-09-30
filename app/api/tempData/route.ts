// pages/api/tempData.ts
import { NextResponse } from "next/server";
import knex from "../../../knex";

export async function POST(req: Request) {
    const trx = await knex.transaction(); // Start a transaction
    try {
      const { namaPengirim, tanggalKeberangkatan } = await req.json();
  
      // Drop the temporary table if it exists
      await trx.raw('DROP TABLE IF EXISTS temp_barang');
  
      // Create a new temporary table
      await trx.raw('CREATE TEMPORARY TABLE temp_barang (id SERIAL PRIMARY KEY, nama_pengirim VARCHAR(255), tanggal_keberangkatan DATE)');
  
      // Insert new item into the temporary table
      await trx('temp_barang').insert({ nama_pengirim: namaPengirim, tanggal_keberangkatan: tanggalKeberangkatan });
  
      // Fetch data from the temporary table to verify insertion
      const data = await trx('temp_barang').select('*');
      console.log("Inserted Data:", data); // Log the fetched data
  
      await trx.commit(); // Commit the transaction
  
      // Check if the new item is in the data
      const newItem = data.find(item => 
        item.nama_pengirim === namaPengirim && 
        item.tanggal_keberangkatan.toISOString().split('T')[0] === new Date(tanggalKeberangkatan).toISOString().split('T')[0]
      );
  
      if (!newItem) {
        console.warn("New item not found in temporary data.");
        return NextResponse.json({ message: "New item not found." }, { status: 404 });
      }
  
      return NextResponse.json(newItem); // Return the new item as JSON response
    } catch (error) {
      console.error('Error in tempData API:', error);
      await trx.rollback(); // Rollback the transaction in case of an error
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
      // No need to destroy the connection here, let Knex handle it
    }
  }