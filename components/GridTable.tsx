"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { AgGridReact } from "ag-grid-react";
import {
  CellPosition,
  ColDef,
  GridApi,
  GridOptions,
  ICellRendererParams,
  NavigateToNextCellParams,
  RowClassParams,
  RowClickedEvent,
  ValueGetterParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
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

// Function to fetch the data with pagination and filters
const fetchPengiriman = async (
  pagination: { page: number; limit: number },
  filters: {
    namaPengirim: string;
    namaPenerima: string;
    tanggalKeberangkatan: string; // Pastikan ini diformat dengan benar
    totalHarga: string;
    barangFilter: string; // Pastikan barangFilter ini diisi jika diperlukan
  }
): Promise<FetchResponse> => {
  const response = await fetch(`/api/pengiriman`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pagination, filters }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const PengirimanTable: React.FC = () => {
  // const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const gridApiRef = useRef<GridApi<Pengiriman> | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalRows: number;
  }>({
    page: 1,
    limit: 10,
    totalRows: 0,
  });

  const [filters, setFilters] = useState<{
    namaPengirim: string;
    namaPenerima: string;
    tanggalKeberangkatan: string;
    totalHarga: string;
    barangFilter: string; // New filter state for barang
  }>({
    namaPengirim: "",
    namaPenerima: "",
    tanggalKeberangkatan: "",
    totalHarga: "",
    barangFilter: "", // Initialize the filter for barang
  });

  // Fetching the data using react-query
  const { data, isLoading, isError, refetch } = useQuery<FetchResponse, Error>(
    ["pengiriman", pagination.page, pagination.limit, filters],
    () => fetchPengiriman(pagination, filters),
    {
      keepPreviousData: true,
    }
  );
  const router = useRouter();

  useEffect(() => {
    refetch();
  }, [pagination.page, pagination.limit, refetch]);

  const highlightText = (text: string, filter: string) => {
    if (!filter) return text;
    const regex = new RegExp(`(${filter})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === filter.toLowerCase() ? (
        <span key={index} style={{ color: "red" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const queryClient = useQueryClient();

  const handleUpdate = (id: number) => {
    router.push(`/pengiriman/${id}`);
  };

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/pengiriman/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pengiriman"]);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };
  const columns: ColDef<Pengiriman>[] = [
    {
      headerName: "No",
      width: 70,
      maxWidth: 70,
      valueGetter: (params) => {
        // Use optional chaining to safely access rowIndex
        const rowIndex = params.node?.rowIndex ?? -1; // Fallback to -1 if null

        return rowIndex >= 0
          ? (pagination.page - 1) * pagination.limit + (rowIndex + 1)
          : ""; // Return an empty string if rowIndex is invalid
      },
      filter: false,
      cellClass: "text-center",
    },
    {
      headerName: "Nama Pengirim",
      field: "namaPengirim",
      filter: "agTextColumnFilter",
      floatingFilter: true,
      cellRenderer: (params: ValueGetterParams) =>
        highlightText(params.data.namaPengirim, filters.namaPengirim),
    },
    {
      headerName: "Nama Penerima",
      field: "namaPenerima",
      filter: "agTextColumnFilter",
      floatingFilter: true,
      cellRenderer: (params: ValueGetterParams) =>
        highlightText(params.data.namaPenerima, filters.namaPenerima),
    },
    {
      headerName: "Total Harga",
      field: "totalHarga",
      filter: "agTextColumnFilter",
      floatingFilter: true,
      cellRenderer: (params: ValueGetterParams) =>
        highlightText(params.data.totalHarga.toString(), filters.totalHarga),
    },
    {
      headerName: "Tanggal Keberangkatan",
      field: "tanggalKeberangkatan",
      filter: "agDateColumnFilter",
      floatingFilter: true,
      cellRenderer: (params: ValueGetterParams) =>
        formatDate(params.data.tanggalKeberangkatan),
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

  const KEY_LEFT = "ArrowLeft";
  const KEY_UP = "ArrowUp";
  const KEY_RIGHT = "ArrowRight";
  const KEY_DOWN = "ArrowDown";

  const navigateToNextCell = (
    params: NavigateToNextCellParams
  ): CellPosition | null => {
    const previousCell = params.previousCellPosition;
    const totalRows = data?.data.length || 0;

    let nextRowIndex;

    switch (params.key) {
      case KEY_DOWN:
        nextRowIndex = previousCell.rowIndex + 1;
        if (nextRowIndex < totalRows) {
          setFocusedRowIndex(nextRowIndex);
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
          setFocusedRowIndex(nextRowIndex);
          return {
            rowIndex: nextRowIndex,
            column: previousCell.column,
            rowPinned: null,
          };
        }
        break;

      case KEY_RIGHT:
      case KEY_LEFT:
        return {
          rowIndex: previousCell.rowIndex,
          column: previousCell.column,
          rowPinned: null,
        };
    }

    return null;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const totalRows = data?.data.length || 0;

    // Update focusedRowIndex based on Arrow keys
    if (event.key === "ArrowDown" && focusedRowIndex < totalRows - 1) {
      setFocusedRowIndex((prev) => prev + 1);
    } else if (event.key === "ArrowUp" && focusedRowIndex > 0) {
      setFocusedRowIndex((prev) => prev - 1);
    }
    if (event.key === "PageDown") {
      handlePageChange(pagination.page + 1);
    } else if (event.key === "PageUp") {
      handlePageChange(pagination.page - 1);
    }
  };

  useEffect(() => {
    // Check if data and data.data are defined and if data.data has items
    if (data && data.data && data.data.length > 0) {
      setFocusedRowIndex(0); // Reset to the first row
    }
  }, [data]);

  // console.log(focusedRowIndex)
  useEffect(() => {
    const gridElement = document.querySelector(
      ".ag-theme-alpine"
    ) as HTMLElement;

    if (gridElement) {
      gridElement.setAttribute("tabindex", "0"); // Make the grid focusable
      gridElement.addEventListener("keydown", handleKeyDown);
      gridElement.focus(); // Ensure the grid is focused on mount
    }

    return () => {
      if (gridElement) {
        gridElement.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [focusedRowIndex]); // Re-apply when focusedRowIndex changes

  // Ensure to highlight the focused row
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
    navigateToNextCell,
    columnDefs: columns,
    getRowClass,
    onGridReady: (params) => {
      gridApiRef.current = params.api; // Store the grid API in the ref
    },
  };

  const handleFilterChanged = (event: {
    api: {
      getFilterModel: () => Record<
        string,
        { filter?: string; dateFrom?: string } | undefined
      >;
    };
  }) => {
    const filterModel = event.api.getFilterModel();
    const selectedDate = filterModel.tanggalKeberangkatan?.dateFrom;
    const formattedTanggal = selectedDate
      ? new Date(selectedDate).toLocaleDateString("en-CA")
      : "";
    setFilters({
      namaPengirim: filterModel.namaPengirim?.filter ?? "",
      namaPenerima: filterModel.namaPenerima?.filter ?? "",
      tanggalKeberangkatan: formattedTanggal,
      totalHarga: filters.totalHarga, // Keep the existing totalHarga filter
      barangFilter: filterModel.barang?.filter ?? "", // Capture the filter for barang
    });
    setPagination((prev) => ({
      ...prev,
      page: 1, // Reset to page 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newPageSize, // Atur limit baru
      page: 1, // Reset to page 1
    }));
  };

  const totalPages = data ? Math.ceil(data.totalData / pagination.limit) : 0;
  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.ensureIndexVisible(focusedRowIndex); // Ensure the row is visible
    }
  }, [focusedRowIndex]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div className="ag-theme-alpine" style={{ height: 519, width: "100%" }}>
      <AgGridReact
        rowData={data?.data || []}
        columnDefs={columns}
        paginationPageSize={pagination.limit}
        gridOptions={{ ...gridOptions, getRowClass }}
        getRowClass={getRowClass}
        onRowClicked={onRowClicked}
        // selectionColumnDef={}
        navigateToNextCell={navigateToNextCell}
        suppressCellFocus={false}
        onFilterChanged={handleFilterChanged}
      />
      <div className="pagination-container">
        <div className="pagination-controls">
          <span className="pagination-info">Page Size:</span>
          <select
            className="pagination-dropdown"
            value={pagination.limit}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Display page range and total count */}
        {/* <div className="pagination-info">
        {pagination.start} to {pagination.end} of {pagination.totalItems}
      </div> */}

        {/* Page navigation buttons */}
        <div className="pagination-controls gap-2">
          <Button
            variant="link"
            className="pagination-button pagination-button-icon"
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
          >
            <MdKeyboardDoubleArrowLeft className="text-2xl text-zinc-700" />
          </Button>
          <Button
            variant="link"
            className="pagination-button pagination-button-icon"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <MdKeyboardArrowLeft className="text-2xl text-zinc-700" />
          </Button>
          <span className="pagination-info text-zinc-700">
            Page {pagination.page} of {totalPages}
          </span>
          <Button
            variant="link"
            className="pagination-button pagination-button-icon"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
          >
            <MdKeyboardArrowRight className="text-2xl text-zinc-700" />
          </Button>
          <Button
            variant="link"
            className="pagination-button pagination-button-icon"
            onClick={() => handlePageChange(totalPages)}
            disabled={pagination.page === totalPages}
          >
            <MdKeyboardDoubleArrowRight className="text-2xl text-zinc-700" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PengirimanTable;
