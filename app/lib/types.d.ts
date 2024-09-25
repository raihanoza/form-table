export interface Barang {
  id: number; // Unique identifier for the barang
  barangId: string; // References the ID from the detail_barang table
  namaBarang: string; // Name of the barang
  jumlahBarang: number; // Quantity of the barang
  harga: number; // Price of the barang
}

export interface Pengiriman {
  id: number;
  namaPengirim: string;
  alamatPengirim: string;
  nohpPengirim: string;
  namaPenerima: string;
  alamatPenerima: string;
  nohpPenerima: string;
  totalHarga: number;
  tanggalKeberangkatan: string;
  barang: Barang[];
}

export interface FilterModel {
  namaPengirim?: { filter: string };
  namaPenerima?: { filter: string };
  tanggalKeberangkatan?: { dateFrom: string };
}

export interface FetchResponse {
  totalData: number;
  totalPages: number;
  currentPage: number;
  data: Pengiriman[];
}
