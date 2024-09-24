import { faker } from '@faker-js/faker';
import knex from '../../knex';

export const seed = async () => {
  const pengirimanData = [];
  const barangData = [];

  // Generate 50 entries
  for (let i = 0; i < 50; i++) {
    const namaPengirim = faker.person.fullName();
    const nohpPengirim = faker.phone.number(); // Generates a random phone number
    const alamatPengirim = faker.location.streetAddress();
    const namaPenerima = faker.person.fullName();
    const nohpPenerima = faker.phone.number();
    const alamatPenerima = faker.location.streetAddress();
    
    // Convert date to MySQL compatible format
    const tanggalKeberangkatan = new Date(faker.date.future()).toISOString().slice(0, 19).replace('T', ' '); 
    const totalHarga = parseFloat(faker.commerce.price());

    pengirimanData.push({
      namaPengirim,
      nohpPengirim,
      alamatPengirim,
      namaPenerima,
      nohpPenerima,
      alamatPenerima,
      tanggalKeberangkatan,
      totalHarga,
    });
  }

  // Insert data into the pengiriman table and get the IDs
  const insertedPengirimanIds = await knex("pengiriman").insert(pengirimanData).returning("id");

  // Generate barang data based on the inserted pengiriman IDs
  for (let i = 0; i < insertedPengirimanIds.length; i++) {
    const pengirimanId = insertedPengirimanIds[i]; // Get the ID of the inserted pengiriman

    // Generate between 1 and 5 barang items for each pengiriman
    const barangCount = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < barangCount; j++) {
      const barangId = 1; // Generate a random UUID
      const jumlahBarang = faker.number.int({ min: 1, max: 10 });
      const harga = parseFloat(faker.commerce.price());

      barangData.push({
        pengirimanId: pengirimanId, // Use the valid pengirimanId here
        barangId,
        jumlahBarang,
        harga,
      });
    }
  }

  // Insert barang data into the database
  await knex("barang").insert(barangData);
};
