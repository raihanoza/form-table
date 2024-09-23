import { NextRequest, NextResponse } from "next/server";
import knex from "../../../knex";

//   id?: number;
//   namaBarang: string;
//   jumlahBarang: number;
//   harga: number;
// }

// Handle POST Request

// type QueryParams = {
//   page?: string;
//   limit?: string;
//   namaPengirim?: string;
//   namaPenerima?: string;
//   tanggalKeberangkatan?: string;
// };

// Handle GET Request
// app/api/pengiriman/route.ts

export async function POST(request: NextRequest) {
  try {
    const { filters, pagination } = await request.json();

    const page = pagination?.page ? parseInt(pagination.page) : 1;
    const limit = pagination?.limit ? parseInt(pagination.limit) : 10;

    const offset = (page - 1) * limit;

    const baseQuery = knex("pengiriman")
      .offset(offset)
      .limit(limit)
      .orderBy("tanggalKeberangkatan", "desc");

    if (filters.namaPengirim) {
      baseQuery.where("namaPengirim", "like", `%${filters.namaPengirim}%`);
    }
    if (filters.namaPenerima) {
      baseQuery.where("namaPenerima", "like", `%${filters.namaPenerima}%`);
    }
    if (filters.tanggalKeberangkatan) {
      const tanggalKeberangkatan = new Date(filters.tanggalKeberangkatan);
      baseQuery.where("tanggalKeberangkatan", "=", tanggalKeberangkatan);
    }
    if (filters.totalHarga) {
      baseQuery.where("totalHarga", "=", parseFloat(filters.totalHarga));
    }
    if (filters.barangFilter) {
      baseQuery.whereExists(function () {
        this.select("*")
          .from("barang")
          .whereRaw("barang.pengirimanId = pengiriman.id")
          .andWhere("barang.namaBarang", "like", `%${filters.barangFilter}%`);
      });
    }

    // Hitung total data
    const totalQuery = knex("pengiriman").clone();
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
          .whereRaw("barang.pengirimanId = pengiriman.id")
          .andWhere("barang.namaBarang", "like", `%${filters.barangFilter}%`);
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
