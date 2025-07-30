'use client';

import React, { useState, useMemo } from 'react';
import { useCity } from '@/contexts/CityContext';
import FieldMap from '@/components/field/FieldMap';
import BuildingModal from '../city/BuildingModal';
import FieldManagementModal from '@/components/field/FieldManagementModal';
import GameTimers from '../city/GameTimers';
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

const Field = React.memo(function Field() {
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

  // Derive existing resource fields from currentCityBuildings
  const existingResourceFields = useMemo(() => {
    const fields: Record<string, number> = {};
    currentCityBuildings.forEach((building: PlayerBuilding) => {
      const slug = building.building.slug;
      // Only count resource buildings (farm, lumbermill, quarry, mine)
      if (['farm', 'lumbermill', 'quarry', 'mine'].includes(slug)) {
        fields[slug] = (fields[slug] || 0) + 1;
      }
    });
    
    logger.debug('Field - existing resource fields calculated', { fields });
    return fields;
  }, [currentCityBuildings]);

  // Derive existing research (placeholder for now)
  const existingResearch = useMemo(() => {
    const research: Record<string, number> = {};
    logger.debug('Field - existing research calculated', { research });
    return research;
  }, []);

  // Get towncenter level to determine available field plots
  const towncenterLevel = useMemo(() => {
    const towncenter = currentCityBuildings.find(
      (building: PlayerBuilding) => building.building.slug === 'towncenter'
    );
    return towncenter?.level || 1;
  }, [currentCityBuildings]);

  // Calculate available field plots based on towncenter level
  const availableFieldPlots = useMemo(() => {
    // Base formula: 10 plots at level 1, +2 plots per level
    const maxPlots = Math.min(10 + (towncenterLevel - 1) * 2, 20); // Cap at 20 plots max
    return maxPlots;
  }, [towncenterLevel]);

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
    logger.debug('Field - plot clicked', { plotId });
    setSelectedPlotId(plotId);
    setIsModalOpen(true);
  };

  const handleBuildingClick = (buildingId: string) => {
    logger.debug('Field - building clicked', { buildingId });
    const building = currentCityBuildings.find((b: PlayerBuilding) => b.id.toString() === buildingId);
    if (building) {
      setSelectedBuilding(building);
      setIsManagementModalOpen(true);
    }
  };

  const handleBuildingSelect = async (building: Building) => {
    if (!currentCity) return;
    
    logger.debug('Field - resource field selected for construction', { 
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
      logger.info('Field - resource field construction started', { 
        buildingId: building.id,
        buildingSlug: building.slug,
        plotId: selectedPlotId,
        constructionData: data
      });
      
      setIsModalOpen(false);
      setSelectedPlotId(null);
      
      // Force a refresh of the field map
      setRefreshTrigger(prev => prev + 1);
      
      // Refresh city data immediately to show the new building
      refreshCityData(currentCity.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start construction';
      logger.info('Field - construction blocked by business rules', { 
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
    
    logger.debug('Field - building upgrade requested', { buildingId });
    
    try {
      const response = await fetch(`/api/city/${currentCity.id}/buildings/${buildingId}/upgrade`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade building');
      }

      logger.info('Field - building upgrade successful', { buildingId });
      showNotification('Building upgraded successfully!', 'success');
      setIsManagementModalOpen(false);
      setSelectedBuilding(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade building';
      logger.error('Field - error upgrading building', { buildingId, error: errorMessage });
      showNotification(errorMessage, 'error');
    }
  };

  const handleBuildingDemolish = async (buildingId: number) => {
    if (!currentCity) return;
    
    logger.debug('Field - building demolition requested', { buildingId });
    
    if (!confirm('Are you sure you want to demolish this resource field?')) {
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

      logger.info('Field - building demolition successful', { buildingId });
      showNotification('Resource field demolished successfully!', 'success');
      setIsManagementModalOpen(false);
      setSelectedBuilding(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to demolish building';
      logger.error('Field - error demolishing building', { buildingId, error: errorMessage });
      showNotification(errorMessage, 'error');
    }
  };

  const handleConstructionComplete = () => {
    logger.debug('Field - construction completed, refreshing city data');
    if (currentCity) {
      refreshCityData(currentCity.id);
    }
    setRefreshTrigger(prev => prev + 1);
    
    // Force an immediate refresh after a short delay to ensure UI updates
    setTimeout(() => {
      logger.debug('Field - forcing delayed refresh after construction complete');
      if (currentCity) {
        refreshCityData(currentCity.id);
      }
      setRefreshTrigger(prev => prev + 1);
    }, 500);
  };

  const handleCityClick = () => {
    logger.debug('Field - city image clicked, switching to city view');
    // This will be handled by the parent component through context or props
    // For now, we'll use a custom event that the parent can listen to
    window.dispatchEvent(new CustomEvent('switchToCityView'));
  };

  if (!currentCity) {
    logger.debug('Field - no current city, showing loading');
    return (
      <div className="w-full h-full bg-forest-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-gold-light">Loading field...</p>
        </div>
      </div>
    );
  }

  logger.debug('Field - rendering field view', { 
    cityId: currentCity.id,
    cityName: currentCity.name,
    buildingCount: currentCityBuildings.length
  });

  return (
    <div className="relative w-full h-full">
      <FieldMap
        cityId={currentCity.id}
        cityAge={currentCity.age}
        onPlotClick={handlePlotClick}
        onBuildingClick={handleBuildingClick}
        refreshTrigger={refreshTrigger}
        onCityClick={handleCityClick}
      />

      <GameTimers
        cityId={currentCity.id}
        onConstructionComplete={handleConstructionComplete}
        onResearchComplete={() => {
          // TODO: Refresh research data
          logger.debug('Field - research completed, should refresh data');
        }}
      />

      {isModalOpen && selectedPlotId && (
        <BuildingModal
          isOpen={isModalOpen}
          plotId={selectedPlotId}
          cityId={currentCity.id}
          cityResources={currentCity.resources}
          cityAge={currentCity.age}
          existingBuildings={existingResourceFields}
          existingResearch={existingResearch}
          towncenterLevel={towncenterLevel}
          availableFieldPlots={availableFieldPlots}
          onBuildingSelect={handleBuildingSelect}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlotId(null);
          }}
          isResourceBuilding={true}
        />
      )}

      {isManagementModalOpen && selectedBuilding && (
        <FieldManagementModal
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

export default Field;