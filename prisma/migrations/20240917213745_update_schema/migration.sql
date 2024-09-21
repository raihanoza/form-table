-- DropForeignKey
ALTER TABLE `barang` DROP FOREIGN KEY `Barang_pengirimanId_fkey`;

-- AddForeignKey
ALTER TABLE `Barang` ADD CONSTRAINT `Barang_pengirimanId_fkey` FOREIGN KEY (`pengirimanId`) REFERENCES `Pengiriman`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
