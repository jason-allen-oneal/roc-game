'use client';

import React, { useState, useMemo } from 'react';
import { useCity } from '@/contexts/CityContext';
import CityMap from './CityMap';
import BuildingModal from './BuildingModal';
import BuildingManagementModal from './BuildingManagementModal';
import ConstructionTimer from './ConstructionTimer';
import NotificationModal from '../NotificationModal';
import logger from '@/lib/logger';

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

const City = React.memo(function City() {
  const { currentCity, currentCityBuildings, refreshCityData } = useCity();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<PlayerBuilding | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Derive existing buildings from currentCityBuildings
  const existingBuildings = useMemo(() => {
    const buildings: Record<string, number> = {};
    currentCityBuildings.forEach((building: PlayerBuilding) => {
      const slug = building.building.slug;
      buildings[slug] = (buildings[slug] || 0) + 1;
    });
    
    logger.debug('City - existing buildings calculated', { buildings });
    return buildings;
  }, [currentCityBuildings]);

  // Derive existing research (placeholder for now)
  const existingResearch = useMemo(() => {
    const research: Record<string, number> = {};
    logger.debug('City - existing research calculated', { research });
    return research;
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({
      isOpen: true,
      message,
      type
    });
  };

  const closeNotification = () => {
    setNotification({
      isOpen: false,
      message: '',
      type: 'info'
    });
  };

  const handlePlotClick = (plotId: string) => {
    logger.debug('City - plot clicked', { plotId });
    setSelectedPlotId(plotId);
    setIsModalOpen(true);
  };

  const handleBuildingClick = (buildingId: string) => {
    logger.debug('City - building clicked', { buildingId });
    const building = currentCityBuildings.find((b: PlayerBuilding) => b.id.toString() === buildingId);
    if (building) {
      setSelectedBuilding(building);
      setIsManagementModalOpen(true);
    }
  };

  const handleBuildingSelect = async (building: Building) => {
    if (!currentCity) return;
    
    logger.debug('City - building selected for construction', { 
      buildingId: building.id, 
      buildingSlug: building.slug,
      buildingName: building.name,
      plotId: selectedPlotId 
    });
    
    try {
      const response = await fetch(`/api/city/${currentCity.id}/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingSlug: building.slug,
          plotId: selectedPlotId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start construction');
      }

      const data = await response.json();
      logger.info('City - building construction started', { 
        buildingId: building.id,
        buildingSlug: building.slug,
        plotId: selectedPlotId,
        constructionData: data
      });
      
      setIsModalOpen(false);
      setSelectedPlotId(null);
      
      // Force a refresh of the city map
      setRefreshTrigger(prev => prev + 1);
      
      // Refresh city data immediately to show the new building
      refreshCityData(currentCity.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start construction';
      logger.info('City - construction blocked by business rules', { 
        buildingId: building.id,
        buildingSlug: building.slug,
        plotId: selectedPlotId,
        reason: errorMessage 
      });
      showNotification(errorMessage, 'info');
    }
  };

  const handleBuildingUpgrade = async (buildingId: number) => {
    if (!currentCity) return;
    
    logger.debug('City - building upgrade requested', { buildingId });
    
    try {
      const response = await fetch(`/api/city/${currentCity.id}/buildings/${buildingId}/upgrade`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade building');
      }

      logger.info('City - building upgrade successful', { buildingId });
      showNotification('Building upgraded successfully!', 'success');
      setIsManagementModalOpen(false);
      setSelectedBuilding(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade building';
      logger.error('City - error upgrading building', { buildingId, error: errorMessage });
      showNotification(errorMessage, 'error');
    }
  };

  const handleBuildingDemolish = async (buildingId: number) => {
    if (!currentCity) return;
    
    logger.debug('City - building demolition requested', { buildingId });
    
    if (!confirm('Are you sure you want to demolish this building?')) {
      return;
    }

    try {
      const response = await fetch(`/api/city/${currentCity.id}/buildings/${buildingId}/demolish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to demolish building');
      }

      logger.info('City - building demolition successful', { buildingId });
      showNotification('Building demolished successfully!', 'success');
      setIsManagementModalOpen(false);
      setSelectedBuilding(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to demolish building';
      logger.error('City - error demolishing building', { buildingId, error: errorMessage });
      showNotification(errorMessage, 'error');
    }
  };

  const handleConstructionComplete = () => {
    logger.debug('City - construction completed, refreshing data');
    if (currentCity) {
      refreshCityData(currentCity.id);
    }
  };

  if (!currentCity) {
    logger.debug('City - no current city, showing loading');
    return (
      <div className="w-full h-full bg-forest-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-gold-light">Loading city...</p>
        </div>
      </div>
    );
  }

  logger.debug('City - rendering city view', { 
    cityId: currentCity.id,
    cityName: currentCity.name,
    buildingCount: currentCityBuildings.length
  });

  return (
    <div className="relative w-full h-full">
      <CityMap
        cityId={currentCity.id}
        cityAge={currentCity.age}
        onPlotClick={handlePlotClick}
        onBuildingClick={handleBuildingClick}
        refreshTrigger={refreshTrigger}
      />

      <ConstructionTimer
        cityId={currentCity.id}
        onConstructionComplete={handleConstructionComplete}
      />

      {isModalOpen && selectedPlotId && (
        <BuildingModal
          isOpen={isModalOpen}
          plotId={selectedPlotId}
          cityId={currentCity.id}
          cityResources={currentCity.resources}
          cityAge={currentCity.age}
          existingBuildings={existingBuildings}
          existingResearch={existingResearch}
          onBuildingSelect={handleBuildingSelect}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlotId(null);
          }}
        />
      )}

      {isManagementModalOpen && selectedBuilding && (
        <BuildingManagementModal
          isOpen={isManagementModalOpen}
          building={selectedBuilding}
          cityId={currentCity.id}
          cityResources={currentCity.resources}
          cityAge={currentCity.age}
          onUpgrade={handleBuildingUpgrade}
          onDemolish={handleBuildingDemolish}
          onClose={() => {
            setIsManagementModalOpen(false);
            setSelectedBuilding(null);
          }}
        />
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </div>
  );
});

export default City;