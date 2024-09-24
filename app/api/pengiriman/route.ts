import { NextRequest, NextResponse } from "next/server";
import knex from "../../../knex";

export async function POST(request: NextRequest) {
  try {
    const { filters, pagination } = await request.json();

    const page = pagination?.page ? parseInt(pagination.page) : 1;
    const limit = pagination?.limit ? parseInt(pagination.limit) : 10;
    const offset = (page - 1) * limit;

    // Base query for fetching pengiriman and related barang and detail_barang data
    const baseQuery = knex("pengiriman")
  .leftJoin("barang", "pengiriman.id", "barang.pengirimanId")
  .leftJoin("detail_barang", "barang.barangId", "detail_barang.id") // Join detail_barang table
  .select(
    "pengiriman.*", // Select all fields from pengiriman
    knex.raw(`
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', barang.id, 
            'namaBarang', detail_barang.nama,
            'jumlahBarang', barang.jumlahBarang
          )
        ), 
        '[]'
      ) as barang
    `) // Aggregate barang data into a JSON array
  )
  .groupBy("pengiriman.id") // Group by pengiriman.id to avoid duplication
  .offset(offset)
  .limit(limit)
  .orderBy("pengiriman.tanggalKeberangkatan", "desc");


    // Apply filters to the query
    if (filters.namaPengirim) {
      baseQuery.where("pengiriman.namaPengirim", "like", `%${filters.namaPengirim}%`);
    }
    if (filters.namaPenerima) {
      baseQuery.where("pengiriman.namaPenerima", "like", `%${filters.namaPenerima}%`);
    }
    if (filters.tanggalKeberangkatan) {
      const tanggalKeberangkatan = new Date(filters.tanggalKeberangkatan);
      baseQuery.where("pengiriman.tanggalKeberangkatan", "=", tanggalKeberangkatan);
    }
    if (filters.totalHarga) {
      baseQuery.where("pengiriman.totalHarga", "=", parseFloat(filters.totalHarga));
    }
    if (filters.barangFilter) {
      baseQuery.whereExists(function () {
        this.select("*")
          .from("barang")
          .leftJoin("detail_barang", "barang.barangId", "detail_barang.id")
          .whereRaw("barang.pengirimanId = pengiriman.id")
          .andWhere("detail_barang.nama", "like", `%${filters.barangFilter}%`);
      });
    }

    // Count total data
    const totalQuery = knex("pengiriman");
    if (filters.namaPengirim) {
      totalQuery.where("namaPengirim", "like", `%${filters.namaPengirim}%`);
    }
    if (filters.namaPenerima) {
      totalQuery.where("namaPenerima", "like", `%${filters.namaPenerima}%`);
    }
    if (filters.tanggalKeberangkatan) {
      const tanggalKeberangkatan = new Date(filters.tanggalKeberangkatan);
      totalQuery.where("tanggalKeberangkatan", "=", tanggalKeberangkatan);
    }
    if (filters.totalHarga) {
      totalQuery.where("totalHarga", "=", parseFloat(filters.totalHarga));
    }
    if (filters.barangFilter) {
      totalQuery.whereExists(function () {
        this.select("*")
          .from("barang")
          .leftJoin("detail_barang", "barang.barangId", "detail_barang.id")
          .whereRaw("barang.pengirimanId = pengiriman.id")
          .andWhere("detail_barang.nama", "like", `%${filters.barangFilter}%`);
      });
    }

    const [{ count }] = await totalQuery.count({ count: "*" });

    // Handle undefined count with default value
    const totalCount = count
      ? typeof count === "string"
        ? parseInt(count)
        : count
      : 0;

    const pengirimanData = await baseQuery;

    return NextResponse.json({
      totalData: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: pengirimanData,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
