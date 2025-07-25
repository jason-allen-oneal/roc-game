'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: number;
  email: string;
  name?: string | null;
  image?: string | null;
  lastPlayedKingdom?: number | null;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!session?.user?.email) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use session data directly since we have it
      const userData: User = {
        id: session.user.id,
        email: session.user.email,
        lastPlayedKingdom: undefined // We'll fetch this separately if needed
      };
      
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const refreshUser = async () => {
    await fetchUser();
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const clearUser = () => {
    setUser(null);
    setError(null);
  };

  // Update user data when session changes
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user) {
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [session, status, fetchUser]);

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    updateUser,
    clearUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 