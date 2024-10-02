import { NextRequest, NextResponse } from "next/server";
import knex from "../../../../knex";
interface Barang {
  barangId: string;
  jumlahBarang: number;
  harga: number;
}
interface PengirimanUpdateRequest {
  id: string; // ID of the pengiriman to update
  namaPengirim?: string;
  alamatPengirim?: string;
  nohpPengirim?: string;
  namaPenerima?: string;
  alamatPenerima?: string;
  nohpPenerima?: string;
  tanggalKeberangkatan?: string; // Keeping it as string because it might be in ISO format
  totalHarga?: number;
  barang?: Barang[];
}
export async function PUT(request: NextRequest) {
  try {
    // Extract the `id` from the URL pathname
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop(); // Get the last segment from the path

    // Parse and validate the incoming request body
    const {
      namaPengirim,
      nohpPengirim,
      alamatPengirim,
      namaPenerima,
      alamatPenerima,
      nohpPenerima,
      tanggalKeberangkatan,
      totalHarga,
      barang,
    }: PengirimanUpdateRequest = await request.json();

    // Basic validation
    if (!id) {
      return NextResponse.json(
        { error: "Missing pengiriman ID" },
        { status: 400 }
      );
    }

    // Use transaction to update `pengiriman` and `barang`
    const updatedPengirimanData = await knex.transaction(async (trx) => {
      // Update the `pengiriman` table
      await trx("pengiriman")
        .where({ id })
        .update({
          namaPengirim,
          nohpPengirim,
          alamatPengirim,
          namaPenerima,
          alamatPenerima,
          nohpPenerima,
          tanggalKeberangkatan: tanggalKeberangkatan
            ? new Date(tanggalKeberangkatan)
            : undefined, // Parse the date if provided
          totalHarga:
            totalHarga !== undefined
              ? parseFloat(totalHarga.toString())
              : undefined, // Ensure totalHarga is a float if provided
        });

      // If barang data is provided, update the `barang` table
      if (barang && barang.length) {
        // Remove existing barang entries associated with this pengiriman
        await trx("barang").where({ pengirimanId: id }).delete();

        // Insert new barang details into the `barang` table
        const barangData = barang.map((item: Barang) => ({
          pengirimanId: id,
          barangId: item.barangId,
          jumlahBarang: item.jumlahBarang,
          harga: parseFloat(item.harga.toString()), // Ensure harga is a float
        }));

        await trx("barang").insert(barangData);
      }

      // Return the updated pengiriman data
      return {
        id,
        updatedFields: {
          namaPengirim,
          nohpPengirim,
          alamatPengirim,
          namaPenerima,
          alamatPenerima,
          nohpPenerima,
          tanggalKeberangkatan,
          totalHarga,
          barang,
        },
      };
    });

    // Success response
    return NextResponse.json({
      message: "Pengiriman berhasil diperbarui",
      data: updatedPengirimanData,
    });
  } catch (error) {
    console.error("Error updating pengiriman:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
