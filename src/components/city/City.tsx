'use client';

import { useState, useEffect } from 'react';
import CityMap from './CityMap';
import BuildingModal from './BuildingModal';
import { useCity } from '@/contexts/CityContext';

interface CityResources {
  food: number;
  wood: number;
  stone: number;
  ore: number;
  gold: number;
}

interface PlayerBuilding {
  id: number;
  playerId: number;
  buildingId: number;
  cityId: number;
  level: number;
  isConstructing: boolean;
  constructionStartedAt: string | null;
  constructionEndsAt: string | null;
  building: {
    id: number;
    name: string;
    slug: string;
    fieldType: number;
    description: string;
    costs: any;
    requirements: any;
    power: number;
    baseValue: number;
    bonusValue: number;
  };
}

export default function City() {
  const { currentCity } = useCity();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [cityResources, setCityResources] = useState<CityResources>({
    food: 0,
    wood: 0,
    stone: 0,
    ore: 0,
    gold: 0
  });
  const [cityAge, setCityAge] = useState(1);
  const [existingBuildings, setExistingBuildings] = useState<{ [key: string]: number }>({});
  const [existingResearch, setExistingResearch] = useState<{ [key: string]: number }>({});
  const [cityId, setCityId] = useState<number>(0);

  useEffect(() => {
    console.log('Current city from context:', currentCity);
    if (currentCity) {
      setCityId(currentCity.id);
      setCityAge(1); // Default to age 1 for now
      setCityResources(currentCity.resources);
    }
  }, [currentCity]);

  const handleBuildingClick = (buildingId: string) => {
    console.log('Building clicked:', buildingId);
    // TODO: Open building management modal/panel
  };

  const handlePlotClick = (plotId: string) => {
    console.log('Plot clicked:', plotId);
    setSelectedPlotId(plotId);
    setIsModalOpen(true);
  };

  const handleBuildingSelect = async (buildingSlug: string) => {
    console.log('Building selected:', buildingSlug, 'for plot:', selectedPlotId);
    
    try {
      const response = await fetch(`/api/city/${cityId}/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingSlug,
          plotId: selectedPlotId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to build:', error);
        // TODO: Show error message to user
        return;
      }

      const result = await response.json();
      console.log('Building construction started:', result);
      
      // Update local resources
      setCityResources(result.updatedResources);
      
      // TODO: Update the UI to show the building under construction
      // TODO: Add a timer to check when construction completes
      
    } catch (error) {
      console.error('Error building construction:', error);
      // TODO: Show error message to user
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlotId('');
  };

  return (
    <div className="relative w-full h-full">
      <CityMap 
        cityId={cityId}
        cityAge={cityAge}
        onBuildingClick={handleBuildingClick}
        onPlotClick={handlePlotClick}
      />
      
      <BuildingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plotId={selectedPlotId}
        cityId={cityId}
        cityResources={cityResources}
        cityAge={cityAge}
        existingBuildings={existingBuildings}
        existingResearch={existingResearch}
        onBuildingSelect={handleBuildingSelect}
      />
    </div>
  );
}