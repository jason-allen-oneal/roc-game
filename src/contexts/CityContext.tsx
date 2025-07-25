'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePlayer } from './PlayerContext';

interface City {
  id: number;
  name: string;
  playerId: number;
  mapTileId: number;
  population: number;
  resources: {
    food: number;
    wood: number;
    stone: number;
    gold: number;
    ore: number;
  };
  buildings: {
    townHall: number;
    houses: number;
    farms: number;
    [key: string]: number;
  };
  createdAt: Date;
}

interface CityContextType {
  cities: City[];
  currentCity: City | null;
  loading: boolean;
  error: string | null;
  setCurrentCity: (city: City) => void;
  refreshCities: () => Promise<void>;
  updateCityResources: (cityId: number, resources: Partial<City['resources']>) => Promise<void>;
  updateCityBuildings: (cityId: number, buildings: Partial<City['buildings']>) => Promise<void>;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  const { player } = usePlayer();
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = useCallback(async () => {
    if (!player?.id) {
      setCities([]);
      setCurrentCity(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/player/${player.id}/cities`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      
      const citiesData = await response.json();
      setCities(citiesData);
      
      // Set the first city as current if no current city is set
      if (citiesData.length > 0 && !currentCity) {
        setCurrentCity(citiesData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCities([]);
      setCurrentCity(null);
    } finally {
      setLoading(false);
    }
  }, [player?.id, currentCity]);

  const refreshCities = async () => {
    await fetchCities();
  };

  const updateCityResources = async (cityId: number, resources: Partial<City['resources']>) => {
    try {
      const response = await fetch(`/api/city/${cityId}/resources`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resources),
      });

      if (!response.ok) {
        throw new Error('Failed to update city resources');
      }

      // Refresh cities to get updated data
      await refreshCities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resources');
    }
  };

  const updateCityBuildings = async (cityId: number, buildings: Partial<City['buildings']>) => {
    try {
      const response = await fetch(`/api/city/${cityId}/buildings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildings),
      });

      if (!response.ok) {
        throw new Error('Failed to update city buildings');
      }

      // Refresh cities to get updated data
      await refreshCities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update buildings');
    }
  };

  // Fetch cities when player changes
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const value: CityContextType = {
    cities,
    currentCity,
    loading,
    error,
    setCurrentCity,
    refreshCities,
    updateCityResources,
    updateCityBuildings,
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
} 