import { Knex } from 'knex';

// Define the type for a single record in the detail_barang table
interface DetailBarang {
  id: number;
  nama: string;
  createdAt: string;
  updatedAt: string;
}

// Create a function to get all records from detail_barang
export const getDetailBarang = async (knex: Knex): Promise<DetailBarang[]> => {
  try {
    // Fetch all records from detail_barang and ensure they match the DetailBarang type
    const results: DetailBarang[] = await knex<DetailBarang>('detail_barang').select('*');
    return results;
  } catch (error) {
    // Log the error with more context
    console.error('Error fetching records from detail_barang:', error);
    throw new Error('Failed to fetch data from detail_barang'); // Rethrow with a clearer message
  }
};
