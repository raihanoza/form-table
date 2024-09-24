"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface Barang {
  id: string;
  namaBarang:string;
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
  console.log(data)
  // const fetchDetailBarang = async () => {
  //   const res = await fetch("/api/detail-barang"); // Ensure the path matches your API route
  //   if (!res.ok) throw new Error("Failed to fetch detail barang");
  //   return res.json();
  // };
  // const { data: detailBarangOptions = [], isLoading:isLoadingDetail } = useQuery(
  //   "detailBarang",
  //   fetchDetailBarang
  // );
  const router = useRouter();

  useEffect(() => {
    // Refetch when pagination changes
    refetch();
  }, [pagination.page, refetch]);

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

  // const formatBarang = (barang: Barang[] | undefined) => {
  //   if (!barang) return ""; // Handle undefined barang
  //   return barang
  //     .map((item) => `${item.namaBarang} (${item.jumlahBarang} pcs)`)
  //     .join(", ");
  // };
  

  const columns: ColDef<Pengiriman>[] = [
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
    // {
    //   headerName: "Barang",
    //   field: "barang",
    //   filter: "agTextColumnFilter", // Adding a text filter for barang
    //   floatingFilter: true,
    //   valueGetter: (params) => formatBarang(params?.data?.barang),
    //   cellRenderer: (params: ValueGetterParams) =>
    //     highlightText(formatBarang(params.data.barang), filters.barangFilter),
    // },    
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
  };
  

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  const totalPages = data ? Math.ceil(data.totalData / pagination.limit) : 0;

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
      <AgGridReact
        rowData={data?.data || []}
        columnDefs={columns}
        paginationPageSize={pagination.limit}
        defaultColDef={{
          flex: 1,
          filter: true,
        }}
        // selectionColumnDef={}
        
        suppressCellFocus={true}
        pagination={true}
        onFilterChanged={handleFilterChanged}
      />
      {/* Pagination Component */}
      <div style={{ marginTop: "10px" }}>
        <Button
          style={{ marginRight: "5px" }}
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {pagination.page} of {totalPages}
        </span>
        <Button
          style={{ marginLeft: "5px" }}
          disabled={pagination.page === totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PengirimanTable;
