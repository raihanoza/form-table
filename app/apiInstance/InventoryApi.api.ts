import axios from "axios";
import { FilterModel } from "../utils/serializeFilterModel";
import { Pengiriman } from "../lib/types";

export async function fetchPengiriman(
  page: number,
  limit: number,
  filterModel: FilterModel
) {
  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filterModel && { filters: JSON.stringify(filterModel) }), // Serialize the filter model
  }).toString();

  const response = await fetch(`/api/pengiriman?${queryString}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

// Function to update pengiriman
export const updatePengiriman = async (
  id: string,
  updatedPengiriman: Pengiriman
): Promise<Pengiriman> => {
  try {
    const response = await axios.put<Pengiriman>(
      `/pengiriman/${id}`,
      updatedPengiriman
    );
    return response.data;
  } catch (error) {
    console.error("Error updating pengiriman:", error);
    throw new Error("Failed to update pengiriman");
  }
};

export const fetchPengirimanById = async (id: string): Promise<Pengiriman> => {
  const response = await axios.get<Pengiriman>(`/api/pengiriman/${id}`);
  return response.data;
};
export const login = async (
  email: string,
  password: string
): Promise<string> => {
  try {
    const response = await axios.post<{ token: string }>("/api/login", {
      email,
      password,
    });
    return response.data.token; // Return the JWT token
  } catch (error) {
    console.error("Error logging in:", error);
    throw new Error("Failed to log in");
  }
};
