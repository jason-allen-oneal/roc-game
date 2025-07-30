'use client';

import React, { useMemo } from 'react';
import { useCity } from '@/contexts/CityContext';
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

interface BuildingArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  buildingType: string;
  level: number;
  isConstructing: boolean;
  playerBuilding: PlayerBuilding;
}

interface FieldMapProps {
  cityId: number;
  cityAge?: number;
  onPlotClick?: (plotId: string) => void;
  onBuildingClick?: (buildingId: string) => void;
  onCityClick?: () => void; // New prop for city image click
  refreshTrigger?: number;
}

// Field plot areas - similar to city plots but for resource fields
const fieldPlotAreas = [
  { id: 'field1', left: '92.4%', top: '45.2%', width: 120, height: 90 },
  { id: 'field2', left: '90.2%', top: '29.8%', width: 120, height: 90 },
  { id: 'field3', left: '84.4%', top: '36%', width: 120, height: 90 },
  { id: 'field4', left: '77.6%', top: '30%', width: 120, height: 90 },
  { id: 'field5', left: '68.6%', top: '38.8%', width: 120, height: 90 },
  { id: 'field6', left: '75.8%', top: '45.6%', width: 120, height: 90 },
  { id: 'field7', left: '86%', top: '52%', width: 120, height: 90 },
  { id: 'field8', left: '79.2%', top: '59%', width: 120, height: 90 },
  { id: 'field9', left: '72.6%', top: '66%', width: 120, height: 90 },
  { id: 'field10', left: '68.6%', top: '52.8%', width: 120, height: 90 },
];

const FieldMap = React.memo(function FieldMap({ 
  cityAge = 1, 
  onPlotClick, 
  onBuildingClick,
  onCityClick,
  refreshTrigger 
}: FieldMapProps) {
  const { currentCityBuildings } = useCity();
  const plotImage = '/field/plot.png';

  // Get field image path with resource type mapping
  const getFieldImagePath = (buildingSlug: string, cityAge: number) => {
    const resourceTypeMap: { [key: string]: string } = {
      'farm': 'food',
      'lumbermill': 'wood', 
      'quarry': 'stone',
      'mine': 'ore'
    };
    
    const resourceType = resourceTypeMap[buildingSlug];
    if (resourceType) {
      return `/field/${resourceType}/${cityAge}.png`;
    }
    return `/field/${buildingSlug}/${cityAge}.png`; // fallback
  };

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
    
    return fieldPlotAreas.slice(0, maxPlots);
  }, [towncenterLevel]);

  // Create building areas from currentCityBuildings
  const buildingAreas: BuildingArea[] = useMemo(() => {
    logger.debug('FieldMap - currentCityBuildings updated', { 
      buildingCount: currentCityBuildings.length,
      towncenterLevel,
      availablePlots: availableFieldPlots.length,
      refreshTrigger
    });
    
    const areas: BuildingArea[] = [];
    
    currentCityBuildings.forEach((playerBuilding: PlayerBuilding) => {
      // Only show resource buildings (farm, lumbermill, quarry, mine)
      if (['farm', 'lumbermill', 'quarry', 'mine'].includes(playerBuilding.building.slug)) {
        // Use the plotId from the database to map buildings to their correct plots
        const plotId = playerBuilding.plotId || 'field1';
        
        logger.debug('FieldMap - processing building', {
          plotId,
          buildingName: playerBuilding.building.name,
          isConstructing: playerBuilding.isConstructing,
          constructionStartedAt: playerBuilding.constructionStartedAt,
          constructionEndsAt: playerBuilding.constructionEndsAt
        });
        
        areas.push({
          id: plotId,
          name: playerBuilding.building.name,
          x: 0, // Not used for positioning
          y: 0, // Not used for positioning
          width: 120,
          height: 80,
          buildingType: playerBuilding.building.slug,
          level: playerBuilding.level,
          isConstructing: playerBuilding.isConstructing,
          playerBuilding: playerBuilding
        });
      }
    });
    
    logger.debug('FieldMap - building areas created', {
      areaCount: areas.length,
      constructingCount: areas.filter(area => area.isConstructing).length
    });
    
    return areas;
  }, [currentCityBuildings, availableFieldPlots, refreshTrigger]);

  const handleAreaClick = (areaId: string) => {
    logger.debug('FieldMap - building area clicked', { areaId });
    onBuildingClick?.(areaId);
  };

  const handlePlotClick = (areaId: string) => {
    logger.debug('FieldMap - plot clicked', { areaId });
    console.log('Field plot clicked:', areaId);
    onPlotClick?.(areaId);
  };

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div className="relative" style={{ width: '840px', height: '476px' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/field/base.png)' }} />
        
        {/* City image overlay based on city age */}
        <div 
          className="absolute cursor-pointer hover:opacity-80 transition-opacity"
          style={{ 
            left: '93%', 
            top: '7.9%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          <img 
            src={`/field/${cityAge || 1}.png`} 
            alt={`City Age ${cityAge || 1}`}
            className="object-contain"
            style={{ 
              maxWidth: '160px', 
              maxHeight: '120px',
              width: 'auto',
              height: 'auto'
            }}
            onError={() => logger.error('FieldMap - failed to load city image', { 
              imagePath: `/field/${cityAge || 1}.png`,
              cityAge: cityAge || 1 
            })}
            onLoad={() => logger.debug('FieldMap - successfully loaded city image', { 
              imagePath: `/field/${cityAge || 1}.png`,
              cityAge: cityAge || 1 
            })}
            onClick={onCityClick}
          />
        </div>

        {availableFieldPlots.map(plot => {
          // Check if this plot has a building
          const buildingArea = buildingAreas.find(area => area.id === plot.id);
          
          if (buildingArea && buildingArea.playerBuilding) {
            // This plot has a building - show the building
            const building = buildingArea.playerBuilding.building;
            const isConstructing = buildingArea.isConstructing;
            
            // Calculate construction progress if building is under construction
            let constructionProgress = 0;
            let shouldShowConstruction = isConstructing;
            
            if (isConstructing && buildingArea.playerBuilding.constructionStartedAt && buildingArea.playerBuilding.constructionEndsAt) {
              const now = new Date().getTime();
              const start = new Date(buildingArea.playerBuilding.constructionStartedAt).getTime();
              const end = new Date(buildingArea.playerBuilding.constructionEndsAt).getTime();
              
              if (now >= end) {
                constructionProgress = 100;
                // If construction time has passed, don't show construction indicator
                shouldShowConstruction = false;
                logger.debug('FieldMap - construction time has passed, hiding indicator', {
                  plotId: plot.id,
                  buildingName: building.name,
                  constructionEndsAt: buildingArea.playerBuilding.constructionEndsAt
                });
              } else if (now > start) {
                constructionProgress = ((now - start) / (end - start)) * 100;
              }
            }
            
            return (
              <div
                key={plot.id}
                className="absolute cursor-pointer transition-all duration-200"
                style={{
                  left: plot.left,
                  top: plot.top,
                  width: plot.width,
                  height: plot.height,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handleAreaClick(buildingArea.playerBuilding!.id.toString())}
                title={`${building.name} (Level ${buildingArea.level})${isConstructing ? ' - Constructing' : ''}`}
              >
                <img
                  src={getFieldImagePath(building.slug, cityAge)}
                  alt={building.name}
                  className={`object-contain ${shouldShowConstruction ? 'opacity-70 animate-pulse' : ''}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'transparent'
                  }}
                  onError={() => {
                    logger.error('FieldMap - failed to load image', { 
                      imagePath: getFieldImagePath(building.slug, cityAge),
                      cityAge: cityAge,
                      fullImagePath: getFieldImagePath(building.slug, cityAge)
                    });
                  }}
                  onLoad={() => {
                    logger.debug('FieldMap - successfully loaded image', { 
                      imagePath: getFieldImagePath(building.slug, cityAge)
                    });
                  }}
                />
                {shouldShowConstruction && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
                    {/* Construction progress bar */}
                    <div className="w-full max-w-[60%] bg-gray-700 rounded-full h-1 mb-1">
                      <div 
                        className="bg-yellow-400 h-1 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${constructionProgress}%` }}
                      />
                    </div>
                    {/* Construction icon */}
                    <div className="text-yellow-400 text-sm mb-0.5 animate-bounce">🔨</div>
                    <div className="text-white text-[8px] font-bold drop-shadow-lg">CONSTRUCTING</div>
                    <div className="text-yellow-400 text-[8px] drop-shadow-lg">{Math.round(constructionProgress)}%</div>
                  </div>
                )}
              </div>
            );
          } else {
            // This plot is empty - show clickable plot
            return (
              <div
                key={plot.id}
                className="absolute cursor-pointer transition-all duration-200 hover:opacity-80"
                style={{
                  left: plot.left,
                  top: plot.top,
                  width: plot.width,
                  height: plot.height,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handlePlotClick(plot.id)}
                title="Click to build resource field"
              >
                <img
                  src={plotImage}
                  alt="Empty field plot"
                  className="object-contain"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
});

export default FieldMap; 