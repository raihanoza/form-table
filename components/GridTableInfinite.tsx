import React, { useCallback, useEffect, useRef, useState } from "react";
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
  GridApi,
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
  const [data, setData] = useState<FetchResponse | null>(null);
  const gridApiRef = useRef<GridApi<Pengiriman> | null>(null);

  const limit = 10;

  const onGridReady = useCallback((params: GridReadyEvent) => {
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

          const lastRow = result.totalData;
          if (result.data.length) {
            params.successCallback(result.data, lastRow);
          } else {
            params.failCallback();
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
        return date.toLocaleDateString("id-ID");
      },
    },
  ];

  const navigateToNextCell = (
    params: NavigateToNextCellParams
  ): CellPosition | null => {
    const previousCell = params.previousCellPosition;
    const currentApi = gridApiRef.current;

    const totalRows = data?.totalData || 0;

    let nextRowIndex = previousCell.rowIndex;

    switch (params.key) {
      case "ArrowDown":
        nextRowIndex = previousCell.rowIndex + 1;

        if (nextRowIndex < totalRows) {
          setFocusedRowIndex(nextRowIndex);

          // Fallback for undefined currentPage and triggering page scroll
          const currentPage = data?.currentPage || 1;
          if (nextRowIndex >= limit * currentPage) {
            currentApi?.paginationGoToNextPage();
          }

          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case "ArrowUp":
        nextRowIndex = previousCell.rowIndex - 1;
        if (nextRowIndex >= 0) {
          setFocusedRowIndex(nextRowIndex);
          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case "ArrowRight":
      case "ArrowLeft":
        return {
          rowIndex: previousCell.rowIndex,
          column: previousCell.column,
          rowPinned: null,
        };
    }

    return null;
  };

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
    navigateToNextCell, // Make sure this is included
    columnDefs: columns,
    onGridReady: (params) => {
      gridApiRef.current = params.api;
    },
  };

  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.ensureIndexVisible(focusedRowIndex);
    }
  }, [focusedRowIndex]);

  return (
    <div className="ag-theme-alpine" style={{ height: 519, width: "100%" }}>
      <AgGridReact
        columnDefs={columns}
        rowModelType="infinite"
        cacheBlockSize={limit}
        maxBlocksInCache={10}
        onRowClicked={onRowClicked}
        animateRows={true}
        navigateToNextCell={navigateToNextCell}
        onGridReady={onGridReady}
        suppressCellFocus={false} // Make sure cell focus is enabled
        gridOptions={gridOptions} // Pass the entire gridOptions correctly
      />
    </div>
  );
};

export default PengirimanTable;
