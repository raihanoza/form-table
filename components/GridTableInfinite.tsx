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
  CellFocusedEvent,
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
  const gridRef = useRef<AgGridReact | null>(null); // Ref for the AgGridReact component
  const relativeRowIndexRef = useRef<number>(0); // Ref untuk simpan relativeRowIndex
  const [data, setData] = useState<FetchResponse | null>(null);
  const gridApiRef = useRef<GridApi<Pengiriman> | null>(null);

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
    params.api.setFocusedCell(0, "namaPengirim"); // Focus the first row
    setTimeout(() => {
      api.setFocusedCell(0, "namaPengirim");
      api.getRowNode("0")?.setSelected(true); // Pilih baris pertama
      api.ensureIndexVisible(0, "middle"); // Pastikan baris pertama terlihat
    }, 0); // Timeout untuk memastikan grid sudah dirender
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
    const visibleRowCount = currentApi?.getDisplayedRowCount() || 10;

    let nextRowIndex = previousCell.rowIndex;
    relativeRowIndexRef.current = previousCell.rowIndex % visibleRowCount;

    switch (params.key) {
      case "ArrowDown":
        nextRowIndex = previousCell.rowIndex + 1;

        // Pastikan tidak melewati batas jumlah total row
        if (nextRowIndex < totalRows) {
          setFocusedRowIndex(nextRowIndex);

          // Fokus baris berikutnya dan pastikan terlihat di tengah layar
          currentApi?.ensureIndexVisible(nextRowIndex, "middle");
          currentApi?.setFocusedCell(nextRowIndex, previousCell.column);

          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case "ArrowUp":
        nextRowIndex = previousCell.rowIndex - 1;

        // Pastikan tidak melewati baris paling atas
        if (nextRowIndex >= 0) {
          setFocusedRowIndex(nextRowIndex);

          // Fokus baris sebelumnya dan pastikan terlihat di tengah layar
          currentApi?.ensureIndexVisible(nextRowIndex, "middle");
          currentApi?.setFocusedCell(nextRowIndex, previousCell.column);

          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case "PageDown":
        if (previousCell.rowIndex + visibleRowCount < totalRows) {
          currentApi?.paginationGoToNextPage();

          setTimeout(() => {
            const newFocusedIndex =
              relativeRowIndexRef.current +
              previousCell.rowIndex -
              (previousCell.rowIndex % visibleRowCount);
            setFocusedRowIndex(newFocusedIndex);
            currentApi?.setFocusedCell(newFocusedIndex, previousCell.column);
            currentApi?.ensureIndexVisible(newFocusedIndex, "middle");
          }, 100);

          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case "PageUp":
        if (previousCell.rowIndex - visibleRowCount >= 0) {
          currentApi?.paginationGoToPreviousPage();

          setTimeout(() => {
            const newFocusedIndex =
              relativeRowIndexRef.current +
              previousCell.rowIndex -
              (previousCell.rowIndex % visibleRowCount);
            setFocusedRowIndex(newFocusedIndex);
            currentApi?.setFocusedCell(newFocusedIndex, previousCell.column);
            currentApi?.ensureIndexVisible(newFocusedIndex, "middle");
          }, 100);

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
  };
  if (data === undefined) {
    return <div>Loading...</div>;
  }
  return (
    <div className="ag-theme-alpine" style={{ height: 519, width: "100%" }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columns}
        rowModelType="infinite"
        cacheBlockSize={limit}
        onCellFocused={onCellFocused}
        maxBlocksInCache={10}
        getRowClass={getRowClass}
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
