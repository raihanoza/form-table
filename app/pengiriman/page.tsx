"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useMutation, useQuery } from "react-query";

// Interface data form
interface Barang {
  id?: string;
  barangId: string;
  jumlahBarang: number;
  harga: number;
}

interface IPengirimanForm {
  namaPengirim: string;
  alamatPengirim: string;
  nohpPengirim: string;
  namaPenerima: string;
  alamatPenerima: string;
  nohpPenerima: string;
  barang: Barang[];
  totalHarga: number; // Added totalHarga field
  tanggalKeberangkatan: string; // Added tanggalKeberangkatan field
}

// Fungsi POST untuk mengirim data
const submitPengiriman = async (data: IPengirimanForm) => {
  const res = await fetch("/api/kirim-barang", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to submit");
  }

  return res.json();
};

// Function to fetch detail barang
const fetchDetailBarang = async () => {
  const res = await fetch("/api/detail-barang"); // Ensure the path matches your API route
  if (!res.ok) throw new Error("Failed to fetch detail barang");
  return res.json();
};

export default function PengirimanForm() {
  const { register, control, handleSubmit, reset, setValue } =
    useForm<IPengirimanForm>({
      defaultValues: {
        barang: [{ barangId: "", jumlahBarang: 1, harga: 0 }],
        totalHarga: 0,
        tanggalKeberangkatan: "",
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "barang",
  });

  const barang = useWatch({ control, name: "barang" });

  // Fetch detail barang
  const { data: detailBarangOptions = [], isLoading } = useQuery(
    "detailBarang",
    fetchDetailBarang
  );

  const calculateTotalHarga = () => {
    const total = barang.reduce(
      (sum, item) => sum + item.jumlahBarang * item.harga,
      0
    );
    setValue("totalHarga", total);
  };

  const router = useRouter();

  React.useEffect(() => {
    calculateTotalHarga();
  }, [barang]);

  const mutation = useMutation(submitPengiriman, {
    onSuccess: (data) => {
      alert(data.message);
      reset();
      router.push("/infinite-scroll");
      localStorage.setItem("newPengirimanId", data.data.pengirimanId);
    },
    onError: () => {
      alert("Error dalam menyimpan data.");
    },
  });

  const onSubmit = (data: IPengirimanForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Form Pengiriman</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Nama Pengirim</label>
            <input
              {...register("namaPengirim", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Alamat Pengirim</label>
            <input
              {...register("alamatPengirim", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block mb-1">No HP Pengirim</label>
            <input
              {...register("nohpPengirim", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Nama Penerima</label>
            <input
              {...register("namaPenerima", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Alamat Penerima</label>
            <input
              {...register("alamatPenerima", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block mb-1">No HP Penerima</label>
            <input
              {...register("nohpPenerima", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Tanggal Keberangkatan</label>
            <input
              type="date"
              {...register("tanggalKeberangkatan", { required: true })}
              className="w-full border border-gray-300 p-2"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Barang</h2>
          {fields.map((item: Barang, index: number) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
            >
              <div>
                <label className="block mb-1">Nama Barang</label>
                <select
                  {...register(`barang.${index}.barangId`, { required: true })}
                  className="w-full border border-gray-300 p-2"
                >
                  <option value="">Pilih Barang</option>
                  {isLoading ? (
                    <option value="">Loading...</option>
                  ) : (
                    detailBarangOptions.map(
                      (barang: { id: string; nama: string }) => (
                        <option key={barang.id} value={barang.id}>
                          {barang.nama}
                        </option>
                      )
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block mb-1">Jumlah Barang</label>
                <input
                  type="number"
                  {...register(`barang.${index}.jumlahBarang`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  className="w-full border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block mb-1">Harga Barang</label>
                <input
                  type="number"
                  {...register(`barang.${index}.harga`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  className="w-full border border-gray-300 p-2"
                />
              </div>
              <div className="col-span-full">
                <button
                  type="button"
                  className="text-red-500"
                  onClick={() => remove(index)}
                >
                  Hapus Barang
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ barangId: "", jumlahBarang: 1, harga: 0 })}
            className="text-blue-500"
          >
            Tambah Barang
          </button>
        </div>

        <div>
          <label className="block mb-1">Total Harga</label>
          <input
            type="number"
            readOnly
            {...register("totalHarga")}
            className="w-full border border-gray-300 p-2"
          />
        </div>

        <div>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Simpan Pengiriman
          </button>
        </div>
      </form>
    </div>
  );
}
