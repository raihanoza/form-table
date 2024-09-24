"use client";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "react-query";

// Define the type for form data
type FormValues = {
  id: string;
  namaPengirim: string;
  alamatPengirim: string;
  nohpPengirim: string;
  namaPenerima: string;
  alamatPenerima: string;
  nohpPenerima: string;
  barang: { barangId: string; jumlahBarang: number; harga: number }[];
  totalHarga: number;
};

// Define a function to submit the data to the server
const submitPengiriman = async (data: FormValues) => {
  const response = await fetch(`/api/pengiriman/${data.id}`, {
    method: "PUT", // or "PATCH" if your API uses PATCH for updates
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Gagal memperbarui pengiriman");
  }

  return response.json();
};

const EditPengirimanPage = () => {
  const { register, handleSubmit, control, setValue, watch, reset } =
    useForm<FormValues>({
      defaultValues: {
        id: "",
        namaPengirim: "",
        alamatPengirim: "",
        nohpPengirim: "",
        namaPenerima: "",
        alamatPenerima: "",
        nohpPenerima: "",
        barang: [{ barangId: "", jumlahBarang: 1, harga: 0 }],
        totalHarga: 0,
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "barang",
  });
  const fetchDetailBarang = async () => {
    const res = await fetch("/api/detail-barang"); // Ensure the path matches your API route
    if (!res.ok) throw new Error("Failed to fetch detail barang");
    return res.json();
  };
  
  const { data: detailBarangOptions = [], isLoading } = useQuery(
    "detailBarang",
    fetchDetailBarang
  );
  const { id } = useParams(); // Use useParams to get URL parameters
  const pengirimanId = id as string;

  const router = useRouter(); // Use useRouter for programmatic navigation

  const mutation = useMutation(submitPengiriman, {
    onSuccess: () => {
      alert("Pengiriman berhasil disimpan!");
      reset();
      router.push("/"); // Redirect to homepage after successful submission
    },
    onError: () => {
      alert("Error dalam menyimpan data.");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    mutation.mutate({ ...data, id: pengirimanId }); // Pass the ID with the data
  };

  // Watch the barang field array for changes
  const barang = watch("barang");

  useEffect(() => {
    const fetchPengiriman = async () => {
      try {
        const response = await fetch(`/api/pengiriman/${pengirimanId}`);

        if (!response.ok) {
          throw new Error("Data tidak ditemukan");
        }

        // Cek jika respons kosong
        if (response.headers.get("Content-Length") === "0") {
          throw new Error("Respons kosong");
        }

        const data = await response.json();

        // Pastikan data yang diterima sesuai dengan FormValues
        const normalizedData: FormValues = {
          id: data.id || "",
          namaPengirim: data.namaPengirim || "",
          alamatPengirim: data.alamatPengirim || "",
          nohpPengirim: data.nohpPengirim || "",
          namaPenerima: data.namaPenerima || "",
          alamatPenerima: data.alamatPenerima || "",
          nohpPenerima: data.nohpPenerima || "",
          barang: data.barang || [
            { barangId: "", jumlahBarang: 1, harga: 0 },
          ],
          totalHarga: data.totalHarga || 0,
        };

        reset(normalizedData);
      } catch (error) {
        console.error("Error fetching pengiriman data:", error);
      }
    };

    if (pengirimanId) {
      fetchPengiriman();
    }
  }, [pengirimanId, reset]);

  useEffect(() => {
    // Calculate totalHarga whenever any item in the barang array changes
    const calculateTotalHarga = () => {
      const total = barang.reduce(
        (sum, item) => sum + (item.jumlahBarang || 0) * (item.harga || 0),
        0
      );
      setValue("totalHarga", total, { shouldValidate: true }); // Update the totalHarga in form
    };

    calculateTotalHarga();
  }, [barang, setValue]);

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
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Barang</h2>
          {fields.map((item, index) => (
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
                    detailBarangOptions.map((barang: { id: string; nama: string }) => (
                      <option key={barang.id} value={barang.id}>
                        {barang.nama}
                      </option>
                    ))
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
            onClick={() =>
              append({ barangId: "", jumlahBarang: 1, harga: 0 })
            }
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
};

export default EditPengirimanPage;
