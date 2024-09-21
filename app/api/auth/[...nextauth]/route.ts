// Ekspor handler sebagai named export untuk GET dan POST
// pages/api/auth/[...nextauth].ts
import NextAuth, { Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { JWT } from "next-auth/jwt";

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

// Definisikan authOptions dengan tipe yang benar
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Validasi input
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email dan password diperlukan");
        }

        // Cari pengguna berdasarkan email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Cek password dengan bcrypt
        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          throw new Error("Email atau password salah");
        }

        return { id: user.id.toString(), email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login", // Ubah ke halaman login Anda
  },
  session: {
    strategy: "jwt" as const, // Gunakan as const untuk menyatakan bahwa ini adalah enum `SessionStrategy`
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        // Set the user id and email to the token, handling undefined cases
        token.id = user.id.toString();
        token.email = user.email ?? ""; // Default to empty string if email is undefined or null
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.JWT_SECRET, // Pastikan ini ada di file .env
};

// Inisialisasi NextAuth
const handler = NextAuth(authOptions);

// Ekspor named untuk GET dan POST
export { handler as GET, handler as POST };
