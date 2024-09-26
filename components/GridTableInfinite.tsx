import React, { useCallback, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  IGetRowsParams,
  GridReadyEvent,
  GridOptions,
  ValueGetterParams,
  NavigateToNextCellParams,
  CellPosition,
  RowClickedEvent,
  RowClassParams,
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

interface FetchResponse {
  totalData: number;
  totalPages: number;
  currentPage: number;
  data: Pengiriman[];
}

const PengirimanTable: React.FC = () => {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [data, setData] = useState<FetchResponse | null>(null); // Change to null initially

  const limit = 10;

  const onGridReady = useCallback((params: GridReadyEvent) => {
    const dataSource = {
      getRows: async (params: IGetRowsParams) => {
        const currentPageNumber = Math.floor(params.startRow / limit) + 1;

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

        try {
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

          const result: FetchResponse = await response.json(); // Extract data
          setData(result); // Store data in state

          const lastRow = result.totalData; // Set last row count
          if (result.data.length) {
            params.successCallback(result.data, lastRow); // Return fetched rows
          } else {
            params.failCallback(); // Handle failure
          }
        } catch (error) {
          console.error("Failed to fetch data", error);
          params.failCallback();
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
      valueGetter: (params: ValueGetterParams) => {
        const date = new Date(params?.data?.tanggalKeberangkatan);
        return date.toLocaleDateString("id-ID"); // Format to Indonesian locale
      },
    },
  ];

  const KEY_DOWN = "ArrowDown";
  const KEY_UP = "ArrowUp";

  const navigateToNextCell = (
    params: NavigateToNextCellParams
  ): CellPosition | null => {
    const previousCell = params.previousCellPosition;
    const totalRows = data?.data.length || 0;

    if (!totalRows) return null; // Prevent navigation if no rows

    let nextRowIndex: number | null = null;

    switch (params.key) {
      case KEY_DOWN:
        nextRowIndex = previousCell.rowIndex + 1;
        if (nextRowIndex < totalRows) {
          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case KEY_UP:
        nextRowIndex = previousCell.rowIndex - 1;
        if (nextRowIndex >= 0) {
          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;
    }

    return null;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const totalRows = data?.data.length || 0;

    if (event.key === KEY_DOWN && focusedRowIndex < totalRows - 1) {
      setFocusedRowIndex(focusedRowIndex + 1);
    } else if (event.key === KEY_UP && focusedRowIndex > 0) {
      setFocusedRowIndex(focusedRowIndex - 1);
    }
  };

  useEffect(() => {
    if (data && data.data.length > 0) {
      setFocusedRowIndex(0);
    }
  }, [data]);

  useEffect(() => {
    const gridElement = document.querySelector(
      ".ag-theme-alpine"
    ) as HTMLElement;

    if (gridElement) {
      gridElement.setAttribute("tabindex", "0");
      gridElement.addEventListener("keydown", handleKeyDown);
      gridElement.focus();
    }

    return () => {
      if (gridElement) {
        gridElement.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [focusedRowIndex]);

  const getRowClass = (params: RowClassParams) => {
    return params.rowIndex === focusedRowIndex ? "custom-row-focus" : "";
  };

  const onRowClicked = (event: RowClickedEvent) => {
    if (event.rowIndex !== null) {
      setFocusedRowIndex(event.rowIndex);
    }
  };
  const gridOptions: GridOptions<Pengiriman> = {
    defaultColDef: {
      editable: true,
      flex: 1,
      minWidth: 100,
      filter: true,
    },
    getRowClass,
    navigateToNextCell,
    columnDefs: columns,
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 519, width: "100%" }}>
      <AgGridReact
        columnDefs={columns}
        rowModelType="infinite"
        cacheBlockSize={limit}
        maxBlocksInCache={10}
        onRowClicked={onRowClicked}
        suppressCellFocus={true}
        animateRows={true}
        onGridReady={onGridReady}
        gridOptions={gridOptions}
      />
    </div>
  );
};

export default PengirimanTable;
