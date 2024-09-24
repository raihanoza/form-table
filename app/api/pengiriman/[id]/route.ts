import { NextResponse } from "next/server";
import knex from "../../../../knex";
import { Barang } from "@/app/lib/types";

// Handle GET Request by ID
export async function GET(request: Request) {
  // Extract ID from URL
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "ID is required and must be a number" },
      { status: 400 }
    );
  }

  try {
    // Query to find the pengiriman by id
    const pengiriman = await knex("pengiriman")
      .where("id", Number(id))
      .first();

    if (!pengiriman) {
      return NextResponse.json(
        { error: "Pengiriman not found" },
        { status: 404 }
      );
    }

    // Fetch associated barang for the pengiriman
    const barang = await knex("barang").where("pengirimanId", Number(id));

    // Combine pengiriman with its associated barang
    pengiriman.barang = barang;

    return NextResponse.json(pengiriman);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle PUT Request for updating
export async function PUT(request: Request) {
  // Extract ID from URL
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "ID is required and must be a number" },
      { status: 400 }
    );
  }

  const data = await request.json();

  try {
    // Update pengiriman
    await knex("pengiriman")
      .where("id", Number(id))
      .update({
        namaPengirim: data.namaPengirim,
        alamatPengirim: data.alamatPengirim,
        nohpPengirim: data.nohpPengirim,
        namaPenerima: data.namaPenerima,
        alamatPenerima: data.alamatPenerima,
        nohpPenerima: data.nohpPenerima,
        totalHarga: data.totalHarga,
      });

    // Upsert barang related to the pengiriman
    await Promise.all(
      data.barang.map(async (item: Barang) => {
        const existingItem = await knex("barang")
          .where({ id: item.id })
          .first();

        if (existingItem) {
          // Update existing barang
          return knex("barang")
            .where({ id: item.id })
            .update({
              barangId: item.barangId,
              jumlahBarang: item.jumlahBarang,
              harga: item.harga,
            });
        } else {
          // Create new barang
          const [insertedId] = await knex("barang").insert({
            pengirimanId: Number(id),
            barangId: item.barangId,
            jumlahBarang: item.jumlahBarang,
            harga: item.harga,
          }, 'id'); // Return the inserted id
          return insertedId;
        }
      })
    );

    // Fetch updated pengiriman
    const updatedPengiriman = await knex("pengiriman")
      .where("id", Number(id))
      .first();
    const barang = await knex("barang").where("pengirimanId", Number(id));

    updatedPengiriman.barang = barang;

    return NextResponse.json(updatedPengiriman);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


// Handle DELETE Request
export async function DELETE(request: Request) {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID is required and must be a number" },
        { status: 400 }
      );
    }

    // Delete associated barang first (foreign key constraint)
    await knex("barang").where("pengirimanId", Number(id)).del();

    // Delete pengiriman
    await knex("pengiriman").where("id", Number(id)).del();

    return NextResponse.json({ message: "Pengiriman deleted successfully" });
  } catch (error) {
    console.error("Error deleting pengiriman", error);
    return NextResponse.json(
      { error: "Error deleting pengiriman" },
      { status: 500 }
    );
  }
}
