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

const fetchPengiriman = async (
  page: number,
  limit: number,
  filters: {
    namaPengirim: string;
    namaPenerima: string;
    tanggalKeberangkatan: string;
  }
): Promise<FetchResponse> => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });
  const response = await fetch(`/api/pengiriman?${query.toString()}`);
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
  }>({
    namaPengirim: "",
    namaPenerima: "",
    tanggalKeberangkatan: "",
  });

  const { data, isLoading, isError, refetch } = useQuery<FetchResponse, Error>(
    ["pengiriman", pagination.page, pagination.limit, filters],
    () => fetchPengiriman(pagination.page, pagination.limit, filters),
    {
      keepPreviousData: true,
    }
  );
  const router = useRouter();

  useEffect(() => {
    // Memanggil ulang data saat pagination berubah
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
    { headerName: "Total Harga", field: "totalHarga" },
    {
      headerName: "Tanggal Keberangkatan",
      field: "tanggalKeberangkatan",
    },
    {
      headerName: "Barang",
      field: "barang",
      valueGetter: (params) =>
        params?.data?.barang.map((item) => item.namaBarang).join(", "),
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

  const handleFilterChanged = (event: {
    api: {
      getFilterModel: () => Record<
        string,
        { filter?: string; dateFrom?: string } | undefined
      >;
    };
  }) => {
    const filterModel = event.api.getFilterModel();
    setFilters({
      namaPengirim: filterModel.namaPengirim?.filter ?? "",
      namaPenerima: filterModel.namaPenerima?.filter ?? "",
      tanggalKeberangkatan: filterModel.tanggalKeberangkatan?.dateFrom ?? "",
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
        defaultColDef={{
          flex: 1,
          filter: true,
        }}
        pagination={false}
        onFilterChanged={handleFilterChanged}
      />
      {/* Komponen Pagination */}
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
