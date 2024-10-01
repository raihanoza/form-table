"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import PengirimanTableInfinite from "@/components/GridTableInfinite";
const Page = () => {
  const [isLoadings, setIsLoadings] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (!session) {
        router.push("/login");
      } else {
        setIsAuthorized(true);
      }
      setIsLoadings(false);
    };

    checkSession();
  }, [router]);

  if (isLoadings) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Daftar Pengiriman</h1>
      <div className="flex flex-row justify-between px-10">
        <div className="flex gap-2 justify-end w-full">
          <Button onClick={() => signOut()}>Log-Out</Button>
        </div>
      </div>

      {isAuthorized && <PengirimanTableInfinite />}
    </div>
  );
};

export default Page;
