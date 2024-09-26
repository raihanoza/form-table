import React, { useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  IGetRowsParams,
  GridReadyEvent,
  GridOptions,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

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

const PengirimanTable: React.FC = () => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const limit = 20;
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api); // Set the grid API
    const dataSource = {
      getRows: async (params: IGetRowsParams) => {
        const currentPageNumber = Math.floor(params.startRow / limit) + 1;

        // Debugging: Log current pagination and request
        console.log("Fetching rows for page:", currentPageNumber);

        const filterModel = params.filterModel; // Directly access filter model
        const selectedDate = filterModel?.tanggalKeberangkatan?.dateFrom;
        const formattedTanggal = selectedDate
          ? new Date(selectedDate).toLocaleDateString("en-CA")
          : "";

        const filters = {
          namaPengirim: filterModel?.namaPengirim?.filter || "",
          namaPenerima: filterModel?.namaPenerima?.filter || "",
          tanggalKeberangkatan: formattedTanggal,
          totalHarga: "", // Adjust if needed
          barangFilter: filterModel?.barang?.filter || "",
        };

        // Fetch data from the server
        const response = await fetch(`/api/infinite-scroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pagination: { page: currentPageNumber, limit },
            filters, // Include the constructed filters
          }),
        });

        const { data: rows, totalData } = await response.json(); // Extract data

        const lastRow = totalData; // Set last row count
        if (rows.length) {
          params.successCallback(rows, lastRow); // Return fetched rows
        } else {
          params.failCallback(); // Handle failure
        }
      },
    };

    params.api.setGridOption("datasource", dataSource);
  }, []);

  const columns: ColDef<Pengiriman>[] = [
    {
      headerName: "Nama Pengirim",
      field: "namaPengirim",
      filter: "agTextColumnFilter",
      floatingFilter: true,
    },
    {
      headerName: "Nama Penerima",
      field: "namaPenerima",
      filter: "agTextColumnFilter",
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
    },
  ];
  const gridOptions: GridOptions<Pengiriman> = {
    defaultColDef: {
      editable: true,
      flex: 1,
      minWidth: 100,
      filter: true,
    },
    columnDefs: columns,
  };
  return (
    <div className="ag-theme-alpine" style={{ height: "600px", width: "100%" }}>
      <AgGridReact
        columnDefs={columns}
        rowModelType="infinite"
        cacheBlockSize={limit}
        maxBlocksInCache={10}
        animateRows={true}
        onGridReady={onGridReady}
        gridOptions={gridOptions}
      />
    </div>
  );
};

export default PengirimanTable;
