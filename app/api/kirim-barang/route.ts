import { NextRequest, NextResponse } from "next/server";
import knex from "../../../knex";

// Define the types for the request payload
interface Barang {
  namaBarang: string;
  jumlah: number;
  harga: number;
}

interface PengirimanRequest {
  namaPengirim: string;
  namaPenerima: string;
  tanggalKeberangkatan: string; // Keeping it as string because it might be in ISO format
  totalHarga: number;
  barang: Barang[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the incoming request body
    const {
      namaPengirim,
      namaPenerima,
      tanggalKeberangkatan,
      totalHarga,
      barang,
    }: PengirimanRequest = await request.json();

    // Basic validation
    if (!namaPengirim || !namaPenerima || !tanggalKeberangkatan || !barang || !barang.length) {
      return NextResponse.json(
        { error: "Missing required fields or no items in barang" },
        { status: 400 }
      );
    }

    // Use transaction to insert into both `pengiriman` and `barang`
    await knex.transaction(async (trx) => {
      // Insert into the `pengiriman` table
      const [pengirimanId] = await trx("pengiriman")
        .insert({
          namaPengirim,
          namaPenerima,
          tanggalKeberangkatan: new Date(tanggalKeberangkatan), // Parse the date
          totalHarga: parseFloat(totalHarga.toString()), // Ensure totalHarga is a float
        })
        .returning("id");

      // Insert barang details into the `barang` table
      const barangData = barang.map((item: Barang) => ({
        pengirimanId,
        namaBarang: item.namaBarang,
        jumlah: item.jumlah,
        harga: parseFloat(item.harga.toString()), // Ensure harga is a float
      }));

      await trx("barang").insert(barangData);
    });

    // Success response
    return NextResponse.json({ message: "Pengiriman berhasil ditambahkan" });
  } catch (error) {
    console.error("Error inserting pengiriman:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
