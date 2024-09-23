// app/api/detail-barang/route.ts

import { NextResponse } from 'next/server';
import knex from '../../../knex'; // Adjust the path to your knex instance
import { getDetailBarang } from '../../lib/barang'; // Adjust the path as needed

export async function GET() {
  try {
    const barangList = await getDetailBarang(knex); // Fetch data from your function
    return NextResponse.json(barangList);
  } catch (error) {
    console.error('Error fetching detail_barang:', error);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
