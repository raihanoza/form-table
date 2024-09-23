import { NextRequest, NextResponse } from "next/server";
import knex from '../../../knex';

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
    // Parse the JSON body from the request
    const { filters, pagination } = await request.json();
    
    const page = pagination?.page ? parseInt(pagination.page) : 1;
    const limit = pagination?.limit ? parseInt(pagination.limit) : 10;

    // Setup pagination
    const offset = (page - 1) * limit;

    // Build the base query
    const query = knex('pengiriman')
      .select('*')
      .offset(offset)
      .limit(limit)
      .orderBy('tanggalKeberangkatan', 'desc');

    // Add filters to the query based on the JSON body
    if (filters.namaPengirim) {
      query.where('namaPengirim', 'like', `%${filters.namaPengirim}%`);
    }
    if (filters.namaPenerima) {
      query.where('namaPenerima', 'like', `%${filters.namaPenerima}%`);
    }
    if (filters.tanggalKeberangkatan) {
      query.where('tanggalKeberangkatan', '=', new Date(filters.tanggalKeberangkatan));
    }
    if (filters.totalHarga) {
      query.where('totalHarga', '=', parseFloat(filters.totalHarga)); // Pastikan totalHarga diparsing sebagai angka
    }
    if (filters.barangFilter) { // Menggunakan nama barang filter
      query.whereExists(function() {
        this.select('*')
          .from('barang')
          .whereRaw('barang.pengirimanId = pengiriman.id')
          .andWhere('barang.namaBarang', 'like', `%${filters.barangFilter}%`);
      });
    }

    // Get the total number of records matching the filters
    const [{ count }] = await knex('pengiriman').count('* as count').where(query.whereRaw('1=1'));

    // Pastikan count diperlakukan sebagai angka
    const totalCount = typeof count === 'string' ? parseInt(count) : count;

    // Execute the query to get the paginated data
    const pengirimanData = await query;

    return NextResponse.json({
      totalData: totalCount, // Gunakan jumlah yang sudah dipastikan
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: pengirimanData,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}