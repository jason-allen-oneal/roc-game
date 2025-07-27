'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import logger from '@/lib/logger';

interface City {
  id: number;
  name: string;
  age: number;
  population: number;
  resources: {
    food: number;
    wood: number;
    stone: number;
    ore: number;
    gold: number;
  };
  playerId: number;
  mapTileId: number;
  createdAt: string;
}

interface Building {
  id: number;
  name: string;
  slug: string;
  fieldType: number;
  description: string;
  costs: Record<string, number>;
  requirements: Record<string, unknown>;
  power: number;
  baseValue: number;
  bonusValue: number;
}

interface PlayerBuilding {
  id: number;
  playerId: number;
  buildingId: number;
  cityId: number;
  plotId: string;
  level: number;
  isConstructing: boolean;
  constructionStartedAt: string | null;
  constructionEndsAt: string | null;
  building: Building;
}

interface CityContextType {
  currentCity: City | null;
  currentCityBuildings: PlayerBuilding[];
  refreshCityData: (cityId: number) => Promise<void>;
  setCurrentCity: (city: City | null) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [currentCityBuildings, setCurrentCityBuildings] = useState<PlayerBuilding[]>([]);

  const refreshCityData = useCallback(async (cityId: number) => {
    try {
      logger.debug('CityContext - refreshing city data', { cityId });
      
      const response = await fetch(`/api/city/${cityId}/data`);
      if (!response.ok) {
        throw new Error(`Failed to fetch city data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      logger.debug('CityContext - city data received', { 
        cityId,
        cityName: data.city?.name,
        buildingCount: data.buildings?.length || 0
      });
      
      setCurrentCity(data.city);
      setCurrentCityBuildings(data.buildings || []);
      
    } catch (error) {
      logger.error('CityContext - error refreshing city data', { 
        cityId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, []);

  // Poll for city data every 3 seconds when there's a current city
  useEffect(() => {
    if (!currentCity) return;

    const interval = setInterval(() => {
      refreshCityData(currentCity.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentCity, refreshCityData]);

  const value = useMemo(() => ({
    currentCity,
    currentCityBuildings,
    refreshCityData,
    setCurrentCity
  }), [currentCity, currentCityBuildings, refreshCityData]);

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