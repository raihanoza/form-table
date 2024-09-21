-- CreateTable
CREATE TABLE `Pengiriman` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaPengirim` VARCHAR(191) NOT NULL,
    `alamatPengirim` VARCHAR(191) NOT NULL,
    `nohpPengirim` VARCHAR(191) NOT NULL,
    `namaPenerima` VARCHAR(191) NOT NULL,
    `alamatPenerima` VARCHAR(191) NOT NULL,
    `nohpPenerima` VARCHAR(191) NOT NULL,
    `totalHarga` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Barang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaBarang` VARCHAR(191) NOT NULL,
    `jumlahBarang` INTEGER NOT NULL,
    `harga` DOUBLE NOT NULL,
    `pengirimanId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Barang` ADD CONSTRAINT `Barang_pengirimanId_fkey` FOREIGN KEY (`pengirimanId`) REFERENCES `Pengiriman`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
