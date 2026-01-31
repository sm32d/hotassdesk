import NextAuth, { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      isActive: boolean;
    } & DefaultSession['user'];
  }
  interface User {
    role: Role;
    isActive: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    isActive: boolean;
  }
}

const nextAuthResult = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        
        if (!user) {
          return null;
        }

        // Check if user is active
        if (!user.isActive) {
          return null;
        }
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.isActive = user.isActive;
      } else if (token.id) {
        // Fetch fresh user status on subsequent requests to handle revocation
        // Skip in Edge Runtime (middleware) to avoid Prisma incompatibility
        if (process.env.NEXT_RUNTIME !== 'edge') {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id },
              select: { isActive: true, role: true }
            });
            
            if (freshUser) {
              token.isActive = freshUser.isActive;
              token.role = freshUser.role;
            }
          } catch (error) {
            // Silently fail in edge cases or DB errors to avoid breaking session
            // The stale token data will be used instead
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    }
  }
});

export const { handlers, auth, signIn, signOut } = nextAuthResult;

export async function getSession() {
  const session = await auth();
  if (!session || !session.user.isActive) {
    return null;
  }
  return session;
}
