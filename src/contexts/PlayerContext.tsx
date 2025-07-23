'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Player {
  id: string;
  name: string;
  gender: string;
  avatar: string;
  kingdomId: string;
  createdAt: Date;
  // Add more player properties as needed
}

interface PlayerContextType {
  player: Player | null;
  loading: boolean;
  error: string | null;
  refreshPlayer: () => Promise<void>;
  updatePlayer: (updates: Partial<Player>) => void;
  clearPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!session?.user?.email) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/player');
      
      if (!response.ok) {
        if (response.status === 404) {
          // Player doesn't exist yet, which is fine
          setPlayer(null);
        } else {
          throw new Error('Failed to fetch player data');
        }
      } else {
        const playerData = await response.json();
        setPlayer(playerData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  const refreshPlayer = async () => {
    await fetchPlayer();
  };

  const updatePlayer = (updates: Partial<Player>) => {
    if (player) {
      setPlayer({ ...player, ...updates });
    }
  };

  const clearPlayer = () => {
    setPlayer(null);
    setError(null);
  };

  // Fetch player data when session changes
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user?.email) {
      fetchPlayer();
    } else {
      setPlayer(null);
      setLoading(false);
    }
  }, [session, status, fetchPlayer]);

  const value: PlayerContextType = {
    player,
    loading,
    error,
    refreshPlayer,
    updatePlayer,
    clearPlayer,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
} 