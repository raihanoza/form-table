import { NextRequest, NextResponse } from "next/server";
import knex from "../../../knex";

export async function POST(request: NextRequest) {
  try {
    const { startRow, endRow, filterModel, sortModel } = await request.json();

    // Pagination
    const limit = endRow - startRow;
    const offset = startRow;

    // Base query for fetching pengiriman and related barang and detail_barang data
    const baseQuery = knex("pengiriman")
      .leftJoin("barang", "pengiriman.id", "barang.pengirimanId")
      .leftJoin("detail_barang", "barang.barangId", "detail_barang.id")
      .select(
        "pengiriman.*",
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
        `)
      )
      .groupBy("pengiriman.id")
      .offset(offset)
      .limit(limit);

    // Apply filters dynamically from filterModel
    if (filterModel) {
      Object.keys(filterModel).forEach((filterKey) => {
        const filterValue = filterModel[filterKey].filter;
        if (filterKey === "namaPengirim") {
          baseQuery.where("pengiriman.namaPengirim", "like", `%${filterValue}%`);
        }
        if (filterKey === "namaPenerima") {
          baseQuery.where("pengiriman.namaPenerima", "like", `%${filterValue}%`);
        }
        if (filterKey === "tanggalKeberangkatan") {
          const tanggalKeberangkatan = new Date(filterValue);
          baseQuery.where("pengiriman.tanggalKeberangkatan", "=", tanggalKeberangkatan);
        }
        if (filterKey === "totalHarga") {
          baseQuery.where("pengiriman.totalHarga", "=", parseFloat(filterValue));
        }
        if (filterKey === "barangFilter") {
          baseQuery.whereExists(function () {
            this.select("*")
              .from("barang")
              .leftJoin("detail_barang", "barang.barangId", "detail_barang.id")
              .whereRaw("barang.pengirimanId = pengiriman.id")
              .andWhere("detail_barang.nama", "like", `%${filterValue}%`);
          });
        }
      });
    }

    // Apply sorting dynamically from sortModel
    if (sortModel.length > 0) {
      const { colId, sort } = sortModel[0]; // assuming single column sorting
      baseQuery.orderBy(colId, sort);
    } else {
      baseQuery.orderBy("pengiriman.tanggalKeberangkatan", "desc"); // Default sorting
    }

    // Count total data
    const totalQuery = knex("pengiriman");
    if (filterModel) {
      Object.keys(filterModel).forEach((filterKey) => {
        const filterValue = filterModel[filterKey].filter;
        if (filterKey === "namaPengirim") {
          totalQuery.where("namaPengirim", "like", `%${filterValue}%`);
        }
        if (filterKey === "namaPenerima") {
          totalQuery.where("namaPenerima", "like", `%${filterValue}%`);
        }
        if (filterKey === "tanggalKeberangkatan") {
          const tanggalKeberangkatan = new Date(filterValue);
          totalQuery.where("tanggalKeberangkatan", "=", tanggalKeberangkatan);
        }
        if (filterKey === "totalHarga") {
          totalQuery.where("totalHarga", "=", parseFloat(filterValue));
        }
        if (filterKey === "barangFilter") {
          totalQuery.whereExists(function () {
            this.select("*")
              .from("barang")
              .leftJoin("detail_barang", "barang.barangId", "detail_barang.id")
              .whereRaw("barang.pengirimanId = pengiriman.id")
              .andWhere("detail_barang.nama", "like", `%${filterValue}%`);
          });
        }
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
