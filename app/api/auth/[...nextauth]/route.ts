import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import db from '../../../../knex'; // Adjust the import according to your setup
import bcrypt from 'bcryptjs';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials || {};
        if (!email || !password) {
          throw new Error('Missing email or password');
        }

        const user = await db('users').where({ email }).first();
        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: '/login', // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export the NextAuth handler
const handler = NextAuth(authOptions)
export {handler as GET, handler as POST}