import { NextRequest, NextResponse } from "next/server";
import knex from "../../../knex";

// Define the types for the request payload
interface Barang {
  barangId: string;
  jumlahBarang: number;
  harga: number;
}

interface PengirimanRequest {
  namaPengirim: string;
  alamatPengirim: string;
  nohpPengirim: string;
  namaPenerima: string;
  alamatPenerima: string;
  nohpPenerima: string;
  tanggalKeberangkatan: string; // Keeping it as string because it might be in ISO format
  totalHarga: number;
  barang: Barang[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the incoming request body
    const {
      namaPengirim,nohpPengirim,alamatPengirim,
      namaPenerima,alamatPenerima,nohpPenerima,
      tanggalKeberangkatan,
      totalHarga,
      barang,
    }: PengirimanRequest = await request.json();

    // Basic validation
    if (!namaPengirim || !namaPenerima || !tanggalKeberangkatan ||!nohpPengirim||!alamatPengirim||!alamatPenerima||!nohpPenerima|| !barang || !barang.length) {
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
          namaPengirim,nohpPengirim,alamatPengirim,
      namaPenerima,alamatPenerima,nohpPenerima,
          tanggalKeberangkatan: new Date(tanggalKeberangkatan), // Parse the date
          totalHarga: parseFloat(totalHarga.toString()), // Ensure totalHarga is a float
        })
        .returning("id");

      // Insert barang details into the `barang` table
      const barangData = barang.map((item: Barang) => ({
        pengirimanId,
        barangId: item.barangId,
        jumlahBarang: item.jumlahBarang,
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
