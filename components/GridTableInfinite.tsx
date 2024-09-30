import React, { useCallback, useEffect, useRef, useState } from "react";
import { AgGridReact, CustomCellRendererProps } from "ag-grid-react";
import {
  ColDef,
  IGetRowsParams,
  GridReadyEvent,
  GridOptions,
  ValueGetterParams,
  RowClickedEvent,
  RowClassParams,
  GridApi,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Button } from "./ui/button";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";

interface Barang {
  id: string;
  namaBarang: string;
  jumlahBarang: number;
  harga: number;
}

interface Pengiriman {
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

interface FetchResponse {
  totalData: number;
  totalPages: number;
  currentPage: number;
  data: Pengiriman[];
}

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
const PengirimanTable: React.FC = () => {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [newPengirimanId, setNewPengirimanId] = useState<number | null>(null);
  const gridRef = useRef<AgGridReact | null>(null); // Ref for the AgGridReact component
  const relativeRowIndexRef = useRef<number>(0); // Ref untuk simpan relativeRowIndex
  const [selectedRowData, setSelectedRowData] = useState<FormValues | null>(
    null
  );
  const [data, setData] = useState<FetchResponse | null>(null);
  const gridApiRef = useRef<GridApi<Pengiriman> | null>(null);
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const limit = 500;
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

  const { data: detailBarangOptions = [], isLoading: isLoadingFetch } =
    useQuery("detailBarang", fetchDetailBarang);
  const { id } = useParams(); // Use useParams to get URL parameters
  const pengirimanId = id as string;

  const router = useRouter(); // Use useRouter for programmatic navigation

  const mutationUpdate = useMutation(submitPengiriman, {
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
    mutationUpdate.mutate({ ...data, id: pengirimanId }); // Pass the ID with the data
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
          barang: data.barang || [{ barangId: "", jumlahBarang: 1, harga: 0 }],
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
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      const api = params.api; // Ambil api dari event onGridReady
      gridApiRef.current = params.api; // Simpan api grid

      const dataSource = {
        getRows: async (params: IGetRowsParams) => {
          const currentPageNumber = Math.floor(params.startRow / limit) + 1;

          const filterModel = params.filterModel;
          const selectedDate = filterModel?.tanggalKeberangkatan?.dateFrom;
          const formattedTanggal = selectedDate
            ? new Date(selectedDate).toLocaleDateString("en-CA")
            : "";

          const filters = {
            namaPengirim: filterModel?.namaPengirim?.filter || "",
            namaPenerima: filterModel?.namaPenerima?.filter || "",
            tanggalKeberangkatan: formattedTanggal,
            totalHarga: "",
            barangFilter: filterModel?.barang?.filter || "",
          };

          try {
            const response = await fetch(`/api/infinite-scroll`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                pagination: { page: currentPageNumber, limit },
                filters,
              }),
            });

            const result: FetchResponse = await response.json();
            setData(result);
            setIsLoading(false);
            const lastRow = result.totalData;
            if (result.data.length) {
              params.successCallback(result.data, lastRow);
              if (newPengirimanId && gridApiRef.current) {
                const rowIndex = result?.data.findIndex(
                  (pengiriman) => pengiriman.id === newPengirimanId
                );
                if (rowIndex !== -1) {
                  setTimeout(() => {
                    gridApiRef.current?.ensureIndexVisible(rowIndex);
                    gridApiRef.current?.setFocusedCell(
                      rowIndex,
                      "namaPengirim"
                    );
                  }, 0);
                }
              }
            } else {
              params.failCallback();
            }
          } catch (error) {
            console.error("Failed to fetch data", error);
            params.failCallback();
            setIsLoading(false);
          }
        },
      };
      // params.api.setFocusedCell(0, "namaPengirim"); // Focus the first row
      setTimeout(() => {
        api.setFocusedCell(0, "namaPengirim");
        api.getRowNode("0")?.setSelected(true); // Pilih baris pertama
        api.ensureIndexVisible(0); // Pastikan baris pertama terlihat
      }, 0); // Timeout untuk memastikan grid sudah dirender
      params.api.setGridOption("datasource", dataSource);
    },
    [newPengirimanId]
  );
  const mutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/pengiriman/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pengiriman"]);

      // Refresh the grid after the delete is successful
      if (gridApiRef.current) {
        gridApiRef.current.refreshInfiniteCache(); // This will refresh the infinite scroll data
      }
    },
    onError: (error) => {
      console.error("Error deleting pengiriman", error);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      mutation.mutate(id);
    }
  };

  const highlightText = (text: string | undefined, filterText: string) => {
    if (!text) return ""; // Handle undefined or null text

    if (!filterText) return text; // Return original text if there's no filter text

    const regex = new RegExp(`(${filterText})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => (
      <span
        key={index}
        style={
          part.toLowerCase() === filterText.toLowerCase()
            ? { backgroundColor: "#aaa" }
            : {}
        }
      >
        {part}
      </span>
    ));
  };

  const columns: ColDef<Pengiriman>[] = [
    {
      headerName: "No.",
      maxWidth: 80,
      valueGetter: "node.id",
      suppressNavigable: true,
      cellRenderer: (props: CustomCellRendererProps) => {
        if (props.value !== undefined) {
          return props.node.rowIndex !== null ? props.node.rowIndex + 1 : 0;
        } else {
          return (
            <img src="https://www.ag-grid.com/example-assets/loading.gif" />
          );
        }
      },
      sortable: false,
      cellClass: "text-center",
    },
    {
      headerName: "Nama Pengirim",
      field: "namaPengirim",
      filter: "agTextColumnFilter",
      cellRenderer: (params: ICellRendererParams) => {
        const filterModel = params.api.getFilterModel();
        const filterText = filterModel.namaPengirim
          ? filterModel.namaPengirim.filter
          : "";
        return <div>{highlightText(params.value, filterText)}</div>;
      },
      floatingFilter: true,
    },
    {
      headerName: "Nama Penerima",
      field: "namaPenerima",
      filter: "agTextColumnFilter",
      cellRenderer: (params: ICellRendererParams) => {
        const filterModel = params.api.getFilterModel();
        const filterText = filterModel.namaPenerima
          ? filterModel.namaPenerima.filter
          : "";
        return <div>{highlightText(params.value, filterText)}</div>;
      },
      floatingFilter: true,
    },
    {
      headerName: "Total Harga",
      field: "totalHarga",
      filter: "agTextColumnFilter",
      floatingFilter: true,
    },
    {
      headerName: "Tanggal Keberangkatan",
      field: "tanggalKeberangkatan",
      filter: "agDateColumnFilter",
      floatingFilter: true,
      valueGetter: (params: ValueGetterParams) => {
        const date = new Date(params?.data?.tanggalKeberangkatan);
        return date.toLocaleDateString("id-ID");
      },
    },
    {
      headerName: "Actions",
      suppressNavigable: true,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Update</Button>
            </DialogTrigger>
            <DialogContent className="min-w-full h-lvh bg-white">
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
                          {...register(`barang.${index}.barangId`, {
                            required: true,
                          })}
                          className="w-full border border-gray-300 p-2"
                        >
                          <option value="">Pilih Barang</option>
                          {isLoadingFetch ? (
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
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => handleDelete(params.data.id)}
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      ),
      cellClass: "text-center",
    },
  ];

  const getRowClass = (params: RowClassParams) => {
    if (params.node.rowIndex === focusedRowIndex) {
      return "ag-row-focus"; // Menambahkan kelas fokus untuk baris
    }
    if (newPengirimanId && params.data.id === newPengirimanId) {
      return "ag-row-focus"; // Gaya fokus untuk baris yang memiliki ID baru
    }
    return "";
  };
  const onRowClicked = (event: RowClickedEvent) => {
    if (event.rowIndex !== null) {
      setFocusedRowIndex(event.rowIndex);
      setSelectedRowData(event.data as FormValues); // Store selected row data
    }
  };

  const gridOptions: GridOptions<Pengiriman> = {
    defaultColDef: {
      editable: true,
      sortable: true,
      flex: 1,
      minWidth: 100,
      filter: true,
    },
    getRowClass,
    columnDefs: columns,
    onGridReady: (params) => {
      gridApiRef.current = params.api;
    },
  };

  useEffect(() => {
    if (data && data.data.length > 0 && gridApiRef.current) {
      gridApiRef.current.setFocusedCell(0, "namaPengirim"); // Assuming you want to focus on 'namaPengirim' column
    }
  }, [data]);

  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.addEventListener("paginationChanged", () => {
        const currentApi = gridApiRef.current;
        if (currentApi) {
          setFocusedRowIndex(relativeRowIndexRef.current);
          currentApi.setFocusedCell(
            relativeRowIndexRef.current,
            "namaPengirim"
          );
        }
      });
    }
  }, []);

  useEffect(() => {
    const savedPengirimanId = localStorage.getItem("newPengirimanId");
    if (savedPengirimanId) {
      setNewPengirimanId(parseInt(savedPengirimanId));
      localStorage.removeItem("newPengirimanId"); // Hapus data setelah digunakan
    }
  }, []);

  useEffect(() => {
    if (selectedRowData) {
      reset(selectedRowData); // Update form values with selected row data
    }
  }, [selectedRowData, reset]);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-5/6 h-full p-10 bg-white shadow-md rounded-lg">
        <div className="ag-theme-alpine w-full" style={{ height: "600px" }}>
          {isLoading ? ( // Show loading spinner while fetching data
            <div>Loading...</div>
          ) : (
            <AgGridReact
              ref={gridRef}
              columnDefs={columns}
              rowModelType="infinite"
              cacheBlockSize={500}
              suppressHeaderFocus={true}
              maxBlocksInCache={500}
              getRowClass={getRowClass}
              onRowClicked={onRowClicked}
              animateRows={true}
              onGridReady={onGridReady}
              suppressCellFocus={false} // Make sure cell focus is enabled
              gridOptions={gridOptions} // Pass the entire gridOptions correctly
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PengirimanTable;
