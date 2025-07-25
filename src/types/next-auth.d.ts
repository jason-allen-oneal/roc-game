import 'next-auth';

declare module 'next-auth' {
  interface User extends Omit<import('next-auth').User, 'id'> {
    id: number;
  }

  interface Session {
    user: {
      id: number;
      email?: string | null;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
  }
} 