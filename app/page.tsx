"use client"; // Tambahkan ini di atas

import PengirimanTable from "@/components/GridTable";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";

const Page = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (!session) {
        router.push("/login"); // Redirect to login if not authenticated
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>; // Optionally, show a loading state
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Daftar Pengiriman</h1>

      <Button
        onClick={() => router.push("/pengiriman")}
        variant="default"
        className="mb-4 w-fit"
      >
        Tambah Pengiriman
      </Button>
      <Button onClick={() => signOut()}>Log-Out</Button>
      {isAuthorized && <PengirimanTable />}
    </div>
  );
};

export default Page;
