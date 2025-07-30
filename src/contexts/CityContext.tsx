'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePlayer } from './PlayerContext';
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
  mapTile?: {
    id: number;
    x: number;
    y: number;
  };
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

interface Research {
  id: number;
  name: string;
  slug: string;
  description: string;
  costs: Record<string, number>;
  requirements: Record<string, unknown>;
  power: number;
  baseValue: number;
  bonusValue: number;
}

interface PlayerResearch {
  id: number;
  playerId: number;
  researchId: number;
  cityId: number;
  level: number;
  isResearching: boolean;
  researchStartedAt: string | null;
  researchEndsAt: string | null;
  research: Research;
}

interface CityContextType {
  currentCity: City | null;
  currentCityBuildings: PlayerBuilding[];
  currentCityResearch: PlayerResearch[];
  refreshCityData: (cityId: number) => Promise<void>;
  setCurrentCity: (city: City | null) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const { player } = usePlayer();
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [currentCityBuildings, setCurrentCityBuildings] = useState<PlayerBuilding[]>([]);
  const [currentCityResearch, setCurrentCityResearch] = useState<PlayerResearch[]>([]);
  const currentCityIdRef = useRef<number | null>(null);

  const refreshCityData = useCallback(async (cityId: number) => {
    try {
      logger.debug('CityContext - refreshing unified city data', { cityId });
      
      const response = await fetch(`/api/city/${cityId}/poll`);
      if (!response.ok) {
        throw new Error(`Failed to fetch city data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      logger.debug('CityContext - unified poll data received', { 
        cityId,
        cityName: data.city?.name,
        buildingCount: data.buildings?.length || 0,
        hasGeneration: !!data.generation,
        constructingCount: data.timers?.constructing?.length || 0,
        researchCount: data.timers?.research?.length || 0
      });
      
      setCurrentCity(data.city);
      setCurrentCityBuildings(data.buildings || []);
      setCurrentCityResearch(data.research || []);
      
    } catch (error) {
      logger.error('CityContext - error refreshing city data', { 
        cityId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, []);

  // Update the ref when currentCity changes
  useEffect(() => {
    currentCityIdRef.current = currentCity?.id || null;
  }, [currentCity?.id]);

  // Load city data when player is available
  useEffect(() => {
    if (!player) {
      setCurrentCity(null);
      setCurrentCityBuildings([]);
      return;
    }

    const loadPlayerCity = async () => {
      try {
        logger.debug('CityContext - loading player city', { playerId: player.id });
        
        const response = await fetch(`/api/player/${player.id}/cities`);
        if (!response.ok) {
          throw new Error(`Failed to fetch player cities: ${response.statusText}`);
        }
        
        const cities = await response.json();
        
        if (cities.length > 0) {
          const firstCity = cities[0];
          logger.debug('CityContext - found player city', { 
            cityId: firstCity.id,
            cityName: firstCity.name
          });
          
          // Load the first city's data
          await refreshCityData(firstCity.id);
        } else {
          logger.debug('CityContext - no cities found for player', { playerId: player.id });
          setCurrentCity(null);
          setCurrentCityBuildings([]);
        }
      } catch (error) {
        logger.error('CityContext - error loading player city', { 
          playerId: player.id,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        setCurrentCity(null);
        setCurrentCityBuildings([]);
      }
    };

    loadPlayerCity();
  }, [player, refreshCityData]);

  // Poll for unified city data every 2 seconds when there's a current city
  useEffect(() => {
    if (!currentCity) return;

    const pollCityData = async () => {
      const cityId = currentCityIdRef.current;
      if (!cityId) return;

      try {
        logger.debug('CityContext - polling unified city data', { cityId });
        
        // Unified call that handles everything: city data, resources, and timers
        await refreshCityData(cityId);
        
        logger.debug('CityContext - unified city data refreshed after polling', { 
          cityId,
          currentResources: currentCity?.resources
        });
        
      } catch (error) {
        logger.error('CityContext - error in polling', { 
          cityId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    };

    const interval = setInterval(pollCityData, 2000);

    return () => clearInterval(interval);
  }, [currentCity?.id, refreshCityData, currentCity]); // Only depend on city ID, not the entire city object

  const value = useMemo(() => ({
    currentCity,
    currentCityBuildings,
    currentCityResearch,
    refreshCityData,
    setCurrentCity
  }), [currentCity, currentCityBuildings, currentCityResearch, refreshCityData]);

  // Debug logging
  useEffect(() => {
    logger.debug('CityContext - state updated', { 
      hasPlayer: !!player,
      playerId: player?.id,
      hasCity: !!currentCity,
      cityId: currentCity?.id,
      cityName: currentCity?.name,
      buildingCount: currentCityBuildings.length,
      researchCount: currentCityResearch.length
    });
  }, [player, currentCity, currentCityBuildings, currentCityResearch]);

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