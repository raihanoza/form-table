"use client";

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
        router.push("/login");
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Daftar Pengiriman</h1>
      <div className="flex flex-row justify-between px-10">
        <Button
          onClick={() => router.push("/pengiriman")}
          variant="default"
          className="mb-4 w-fit"
        >
          Tambah Pengiriman
        </Button>
        <Button onClick={() => signOut()}>Log-Out</Button>
      </div>

      {isAuthorized && <PengirimanTable />}
    </div>
  );
};

export default Page;
