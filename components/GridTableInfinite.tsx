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
import { FaPlus } from "react-icons/fa6";
import { MdDelete, MdEdit } from "react-icons/md";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";

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
const PengirimanTable: React.FC = () => {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<Pengiriman | null>(null);
  const [newPengirimanId, setNewPengirimanId] = useState<number | null>(null);
  const gridRef = useRef<AgGridReact | null>(null); // Ref for the AgGridReact component
  const relativeRowIndexRef = useRef<number>(0); // Ref untuk simpan relativeRowIndex
  const [data, setData] = useState<FetchResponse | null>(null);
  const gridApiRef = useRef<GridApi<Pengiriman> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [popOver, setPopOver] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const limit = 50;
  const queryClient = useQueryClient();
  // const router = useRouter();
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
  const fetchDetailBarang = async () => {
    const res = await fetch("/api/detail-barang"); // Ensure the path matches your API route
    if (!res.ok) throw new Error("Failed to fetch detail barang");
    return res.json();
  };
  // Fetch detail barang
  const { data: detailBarangOptions = [], isLoading: isLoadingBarang } =
    useQuery("detailBarang", fetchDetailBarang);

  const calculateTotalHarga = () => {
    const total = barang.reduce(
      (sum, item) => sum + item.jumlahBarang * item.harga,
      0
    );
    setValue("totalHarga", total);
  };

  React.useEffect(() => {
    calculateTotalHarga();
  }, [barang]);

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
  const updatePengiriman = async (id: number, data: IPengirimanForm) => {
    const res = await fetch(`/api/kirim-barang`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update data");
    return res.json();
  };

  const mutation = useMutation(submitPengiriman, {
    onSuccess: (data) => {
      console.log("Data submitted successfully:", data);
      const newPengirimanId = data.data.pengirimanId; // ID pengiriman baru
      setNewPengirimanId(newPengirimanId); // Simpan ID pengiriman baru
      localStorage.setItem("newPengirimanId", String(newPengirimanId)); // Simpan di localStorage
      alert(data.message);

      setPopOver(false);
      reset();

      // Invalidate the pengiriman query so it refetches
      queryClient.invalidateQueries("pengiriman");

      // Reload halaman setelah pengiriman sukses
      window.location.reload();
    },
    onError: () => {
      alert("Error dalam menyimpan data.");
    },
  });
  const mutationUpdate = useMutation(
    async (updatedData: IPengirimanForm) => {
      if (selectedRow && selectedRow.id) {
        return updatePengiriman(selectedRow.id, updatedData);
      }
    },
    {
      onSuccess: () => {
        alert("Data berhasil diperbarui.");
        setPopOver(false);
        reset();
        setEditMode(false); // Kembali ke mode tambah setelah update
        queryClient.invalidateQueries("pengiriman");
      },
      onError: () => {
        alert("Gagal memperbarui data.");
      },
    }
  );
  const onSubmit = (data: IPengirimanForm) => {
    if (editMode && selectedRow !== null) {
      mutationUpdate.mutate(data);
    } else {
      mutation.mutate(data);
    }
  };

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
  const mutationDelete = useMutation({
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

  const handleDelete = () => {
    // Check if focusedRowIndex is valid
    if (focusedRowIndex === null || focusedRowIndex === undefined) {
      alert("Please select a row to delete.");
      return;
    }

    // Retrieve the row node safely
    const rowNode = gridApiRef.current?.getRowNode(focusedRowIndex.toString());

    // Log the rowNode for debugging
    console.log("RowNode: ", rowNode);

    // Check if rowNode is defined
    if (!rowNode) {
      alert("Row not found.");
      return;
    }

    // Extract the ID from the row node
    const idToDelete = rowNode.data?.id; // Use optional chaining here

    // Log the ID for debugging
    console.log("ID to delete: ", idToDelete);

    if (idToDelete === undefined) {
      alert("Unable to retrieve ID for deletion.");
      return;
    }

    // Confirm deletion
    if (window.confirm("Are you sure you want to delete this item?")) {
      mutationDelete.mutate(idToDelete);
      setFocusedRowIndex(focusedRowIndex);
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

  const handleEditClick = () => {
    if (selectedRow) {
      setEditMode(true); // Masuk ke mode edit
      setValue("namaPengirim", selectedRow.namaPengirim);
      setValue("alamatPengirim", selectedRow.alamatPengirim);
      setValue("nohpPengirim", selectedRow.nohpPengirim);
      setValue("namaPenerima", selectedRow.namaPenerima);
      setValue("alamatPenerima", selectedRow.alamatPenerima);
      setValue("nohpPenerima", selectedRow.nohpPenerima);
      setValue("barang", selectedRow.barang);
      setValue("totalHarga", selectedRow.totalHarga);
      setValue("tanggalKeberangkatan", selectedRow.tanggalKeberangkatan);
      setPopOver(true); // Buka form dialog
    }
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
      setNewPengirimanId(null);
    }
    const rowData = event.data as Pengiriman;
    setSelectedRow(rowData);
    localStorage.removeItem("newPengirimanId"); // Hapus data setelah digunakan
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
              cacheBlockSize={50}
              suppressHeaderFocus={true}
              maxBlocksInCache={50}
              getRowClass={getRowClass}
              onRowClicked={onRowClicked}
              animateRows={true}
              onGridReady={onGridReady}
              suppressCellFocus={false} // Make sure cell focus is enabled
              gridOptions={gridOptions} // Pass the entire gridOptions correctly
            />
          )}
        </div>
        <div className="mt-6 gap-2 flex">
          <Dialog open={popOver} onOpenChange={setPopOver}>
            <DialogTrigger asChild onClick={() => setPopOver(true)}>
              <Button variant="success" className="font-semibold text-sm">
                <FaPlus /> Add
              </Button>
            </DialogTrigger>
            {popOver ? (
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
                    <div>
                      <label className="block mb-1">
                        Tanggal Keberangkatan
                      </label>
                      <input
                        type="date"
                        {...register("tanggalKeberangkatan", {
                          required: true,
                        })}
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
                            {...register(`barang.${index}.barangId`, {
                              required: true,
                            })}
                            className="w-full border border-gray-300 p-2"
                          >
                            <option value="">Pilih Barang</option>
                            {isLoadingBarang ? (
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
            ) : (
              ""
            )}
          </Dialog>

          <Button
            onClick={handleEditClick}
            variant="warning"
            className="font-semibold text-sm"
          >
            <MdEdit /> Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="font-semibold text-sm"
          >
            <MdDelete />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PengirimanTable;
