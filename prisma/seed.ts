const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

async function main() {
  // Seed 50 Pengiriman
  for (let i = 0; i < 50; i++) {
    const pengiriman = await prisma.pengiriman.create({
      data: {
        namaPengirim: faker.person.fullName(),
        alamatPengirim: faker.location.streetAddress(),
        nohpPengirim: faker.phone.number(),
        namaPenerima: faker.person.fullName(),
        alamatPenerima: faker.location.streetAddress(),
        nohpPenerima: faker.phone.number(),
        totalHarga: parseFloat(faker.commerce.price()),
        tanggalKeberangkatan: faker.date.future(),
        barang: {
          create: Array.from({ length: 5 }, () => ({
            namaBarang: faker.commerce.productName(),
            jumlahBarang: faker.number.int({ min: 1, max: 10 }),
            harga: parseFloat(faker.commerce.price()),
          })),
        },
      },
    });

    console.log(`Created Pengiriman with ID: ${pengiriman.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
