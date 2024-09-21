import { Barang } from "@/app/lib/types";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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
    const pengiriman = await prisma.pengiriman.findUnique({
      where: { id: Number(id) },
      include: { barang: true },
    });

    if (!pengiriman) {
      return NextResponse.json(
        { error: "Pengiriman not found" },
        { status: 404 }
      );
    }

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

  const updatedPengiriman = await prisma.pengiriman.update({
    where: { id: Number(id) },
    data: {
      namaPengirim: data.namaPengirim,
      alamatPengirim: data.alamatPengirim,
      nohpPengirim: data.nohpPengirim,
      namaPenerima: data.namaPenerima,
      alamatPenerima: data.alamatPenerima,
      nohpPenerima: data.nohpPenerima,
      totalHarga: data.totalHarga,
      barang: {
        upsert: data.barang.map((item: Barang) => ({
          where: { id: item.id || -1 }, // Assuming item.id is the unique identifier for barang
          update: {
            namaBarang: item.namaBarang,
            jumlahBarang: item.jumlahBarang,
            harga: item.harga,
          },
          create: {
            namaBarang: item.namaBarang,
            jumlahBarang: item.jumlahBarang,
            harga: item.harga,
          },
        })),
      },
    },
  });

  return NextResponse.json(updatedPengiriman);
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

    await prisma.pengiriman.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Pengiriman deleted successfully" });
  } catch (error) {
    console.error("Error deleting pengiriman", error);
    return NextResponse.json(
      { error: "Error deleting pengiriman" },
      { status: 500 }
    );
  }
}
