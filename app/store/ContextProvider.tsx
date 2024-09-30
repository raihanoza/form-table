"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the Barang interface
interface Barang {
  id: string;
  namaBarang: string;
  jumlahBarang: number;
  harga: number;
}

// Define the Pengiriman interface
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

// Update the context type
interface NewItemContextType {
  newItem: Pengiriman | null; // Change type to Pengiriman
  setNewItem: (item: Pengiriman | null) => void; // Change type to Pengiriman
}

// Create Context
const NewItemContext = createContext<NewItemContextType | undefined>(undefined);

// Hook to use the Context
export const useNewItemContext = () => {
  const context = useContext(NewItemContext);
  if (!context) {
    throw new Error("useNewItemContext must be used within a ContextProvider");
  }
  return context;
};

// Context Provider
interface ContextProviderProps {
  children: ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({
  children,
}) => {
  const [newItem, setNewItem] = useState<Pengiriman | null>(null); // Change state to Pengiriman

  return (
    <NewItemContext.Provider value={{ newItem, setNewItem }}>
      {children}
    </NewItemContext.Provider>
  );
};
