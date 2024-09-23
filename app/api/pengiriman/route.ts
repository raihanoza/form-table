import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

interface Barang {
  id?: number;
  namaBarang: string;
  jumlahBarang: number;
  harga: number;
}

// Handle POST Request
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const newPengiriman = await prisma.pengiriman.create({
      data: {
        namaPengirim: data.namaPengirim,
        alamatPengirim: data.alamatPengirim,
        nohpPengirim: data.nohpPengirim,
        namaPenerima: data.namaPenerima,
        alamatPenerima: data.alamatPenerima,
        nohpPenerima: data.nohpPenerima,
        totalHarga: data.totalHarga,
        tanggalKeberangkatan: new Date(data.tanggalKeberangkatan),
        barang: {
          create: data.barang.map((item: Barang) => ({
            namaBarang: item.namaBarang,
            jumlahBarang: item.jumlahBarang,
            harga: item.harga,
          })),
        },
      },
    });

    return NextResponse.json(newPengiriman);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error creating pengiriman" },
      { status: 500 }
    );
  }
}

// type QueryParams = {
//   page?: string;
//   limit?: string;
//   namaPengirim?: string;
//   namaPenerima?: string;
//   tanggalKeberangkatan?: string;
// };

// Handle GET Request
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const namaPengirim = searchParams.get("namaPengirim") || "";
    const namaPenerima = searchParams.get("namaPenerima") || "";
    const tanggalKeberangkatan = searchParams.get("tanggalKeberangkatan");
    const totalHarga = searchParams.get("totalHarga");
    const barang = searchParams.get("barang");

    // Setup paginasi
    const take = parseInt(limit); // Batasan per halaman
    const skip = (parseInt(page) - 1) * take; // Jumlah data yang dilewati

    // Definisikan tipe filter secara eksplisit
    const filters: Prisma.PengirimanFindManyArgs = {
      where: {
        namaPengirim: {
          contains: namaPengirim, // Filter by namaPengirim jika tersedia
        },
        namaPenerima: {
          contains: namaPenerima, // Filter by namaPenerima jika tersedia
        },
        tanggalKeberangkatan: tanggalKeberangkatan
          ? new Date(tanggalKeberangkatan)
          : undefined, // Filter by tanggalKeberangkatan jika tersedia
      },
      take, // Ambil sejumlah data yang diminta (paginasi)
      skip, // Lewati sejumlah data untuk paginasi
      orderBy: {
        tanggalKeberangkatan: "desc", // Gunakan string "desc" langsung
      },
      include: {
        barang: true, // Sertakan data barang terkait
      },
    };

    // Tambahkan filter untuk `totalHarga` jika ada
    if (totalHarga) {
      filters.where!.totalHarga = {
        equals: parseFloat(totalHarga), // Filter by totalHarga jika tersedia
      };
    }

    // Tambahkan filter untuk `barang` jika ada
    if (barang) {
      filters.where!.barang = {
        some: {
          namaBarang: {
            contains: barang, // Filter by barang (nama) jika tersedia
          },
        },
      };
    }

    // Dapatkan total data yang sesuai dengan filter
    const totalData = await prisma.pengiriman.count({ where: filters.where });

    // Query data Pengiriman dari database
    const pengirimanData = await prisma.pengiriman.findMany(filters);

    return NextResponse.json({
      totalData,
      totalPages: Math.ceil(totalData / take),
      currentPage: parseInt(page),
      data: pengirimanData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
