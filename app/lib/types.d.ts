export interface Barang {
  id: number;
  barangId: string;
  jumlahBarang: number;
  harga: number;
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
