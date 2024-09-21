"use client"; // Tambahkan ini di atas
// pages/register.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Pastikan Anda memiliki komponen Button
import { Input } from "@/components/ui/input"; // Pastikan Anda memiliki komponen Input
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json(); // Dapatkan data dari respons
      setSuccess("Registrasi berhasil! Silakan login.");
      setError("");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      const errorResponse = await response.text(); // Ambil respons sebagai teks
      try {
        const { message } = JSON.parse(errorResponse); // Coba parse sebagai JSON
        setError(message);
      } catch (err) {
        setError("Terjadi kesalahan, coba lagi nanti."); // Pesan umum jika parsing gagal
      }
      setSuccess("");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Registrasi</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Email:
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Password:
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Konfirmasi Password:
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <Button type="submit" variant="default" className="w-full">
            Daftar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Masuk di sini
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
