/*
  Warnings:

  - Added the required column `tanggalKeberangkatan` to the `Pengiriman` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pengiriman` ADD COLUMN `tanggalKeberangkatan` DATETIME(3) NOT NULL;
