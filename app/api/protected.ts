// pages/api/protected.ts
import { getSession } from "next-auth/react";
import type { NextApiRequest, NextApiResponse } from "next";

const protectedRoute = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Your protected code here
  res.status(200).json({ message: "Welcome to the protected API route" });
};

export default protectedRoute;
