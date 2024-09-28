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
  CellFocusedEvent,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Button } from "./ui/button";
import { useMutation, useQueryClient } from "react-query";
import { useRouter } from "next/navigation";

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

const PengirimanTable: React.FC = () => {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);

  const gridRef = useRef<AgGridReact | null>(null); // Ref for the AgGridReact component
  const relativeRowIndexRef = useRef<number>(0); // Ref untuk simpan relativeRowIndex
  const [data, setData] = useState<FetchResponse | null>(null);
  const gridApiRef = useRef<GridApi<Pengiriman> | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const limit = 500;

  const onGridReady = useCallback((params: GridReadyEvent) => {
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
    params.api.setFocusedCell(0, "namaPengirim"); // Focus the first row
    setTimeout(() => {
      api.setFocusedCell(0, "namaPengirim");
      api.getRowNode("0")?.setSelected(true); // Pilih baris pertama
      api.ensureIndexVisible(0); // Pastikan baris pertama terlihat
    }, 0); // Timeout untuk memastikan grid sudah dirender
    params.api.setGridOption("datasource", dataSource);
  }, []);
  const handleUpdate = (id: number) => {
    router.push(`/pengiriman/${id}`);
  };

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
      suppressHeaderMenuButton: true,
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
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex space-x-2">
          <Button onClick={() => handleUpdate(params.data.id)}>Update</Button>
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
    return params.node.rowIndex === focusedRowIndex ? "custom-row-focus" : "";
  };

  const onRowClicked = (event: RowClickedEvent) => {
    if (event.rowIndex !== null) {
      setFocusedRowIndex(event.rowIndex);
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
  const onCellFocused = (event: CellFocusedEvent) => {
    setFocusedRowIndex(event.rowIndex ?? 0);
    event.rowIndex ? "custom-row-focus" : "";
  };
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
              onCellFocused={onCellFocused}
              maxBlocksInCache={500}
              getRowClass={getRowClass}
              onRowClicked={onRowClicked}
              animateRows={true}
              // navigateToNextCell={navigateToNextCell}
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
