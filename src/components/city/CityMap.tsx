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
  buildingType?: string;
  level?: number;
  isConstructing?: boolean;
  playerBuilding?: PlayerBuilding;
}

interface CityMapProps {
  cityId: number;
  cityAge?: number;
  onBuildingClick?: (buildingId: string) => void;
  onPlotClick?: (plotId: string) => void;
  refreshTrigger?: number;
}

const CityMap = React.memo(function CityMap({ cityAge = 1, onBuildingClick, onPlotClick }: CityMapProps) {
  const { currentCityBuildings } = useCity();
  const plotImage = '/city/plot.png';

  // Create building areas from currentCityBuildings
  const buildingAreas: BuildingArea[] = useMemo(() => {
    logger.debug('CityMap - currentCityBuildings updated', { 
      buildingCount: currentCityBuildings.length 
    });
    
    const areas: BuildingArea[] = [];
    
    currentCityBuildings.forEach((playerBuilding: PlayerBuilding) => {
      // Use the plotId from the database to map buildings to their correct plots
      // The plotId should be in the format 'plot1', 'plot2', etc.
      const plotId = playerBuilding.plotId || 'plot27'; // Fallback for Town Center
      
      areas.push({
        id: plotId,
        name: playerBuilding.building.name,
        x: 0, // Not used for positioning
        y: 0, // Not used for positioning
        width: 99,
        height: 55,
        buildingType: playerBuilding.building.slug,
        level: playerBuilding.level,
        isConstructing: playerBuilding.isConstructing,
        playerBuilding: playerBuilding
      });
    });
    
    logger.debug('CityMap - created building areas', { 
      areaCount: areas.length,
      areas: areas.map(a => ({ id: a.id, name: a.name, isConstructing: a.isConstructing }))
    });
    
    return areas;
  }, [currentCityBuildings]);

  const handleAreaClick = (areaId: string) => {
    logger.debug('CityMap - building area clicked', { areaId });
    onBuildingClick?.(areaId);
  };

  const handlePlotClick = (areaId: string) => {
    logger.debug('CityMap - plot clicked', { areaId });
    onPlotClick?.(areaId);
  };

  const plotAreas = [
    { id: 'plot1', left: '90.9%', top: '42.7%', width: 99, height: 55 },
    { id: 'plot2', left: '84.8%', top: '36.8%', width: 99, height: 55 },
    { id: 'plot3', left: '76.6%', top: '28.9%', width: 99, height: 55 },
    { id: 'plot4', left: '70.2%', top: '23.6%', width: 99, height: 55 },
    { id: 'plot5', left: '62%', top: '16.5%', width: 99, height: 55 },
    { id: 'plot6', left: '55.9%', top: '11.5%', width: 99, height: 55 },
    
    { id: 'plot7', left: '85.0%', top: '48.4%', width: 99, height: 55 },
    { id: 'plot8', left: '79.2%', top: '42.9%', width: 99, height: 55 },
    { id: 'plot9', left: '70.6%', top: '34.8%', width: 99, height: 55 },
    { id: 'plot10', left: '64%', top: '30%', width: 99, height: 55 },
    { id: 'plot11', left: '55.9%', top: '22.2%', width: 99, height: 55 },
    { id: 'plot12', left: '49.4%', top: '16.9%', width: 99, height: 55 },

    { id: 'plot13', left: '78.6%', top: '54.6%', width: 99, height: 55 },
    { id: 'plot14', left: '72.8%', top: '49.3%', width: 99, height: 55 },
    { id: 'plot15', left: '64.2%', top: '41.2%', width: 99, height: 55 },
    { id: 'plot16', left: '58%', top: '35.2%', width: 99, height: 55 },
    { id: 'plot17', left: '50.6%', top: '28.2%', width: 99, height: 55 },
    { id: 'plot18', left: '43.8%', top: '22.8%', width: 99, height: 55 },

    { id: 'plot19', left: '72.6%', top: '60%', width: 99, height: 55 },
    { id: 'plot20', left: '66.8%', top: '54.7%', width: 99, height: 55 },
    { id: 'plot21', left: '58.6%', top: '47.5%', width: 99, height: 55 },
    { id: 'plot22', left: '52.4%', top: '41.5%', width: 99, height: 55 },
    { id: 'plot23', left: '44.2%', top: '34.2%', width: 99, height: 55 },
    { id: 'plot24', left: '37.8%', top: '28.8%', width: 99, height: 55 },

    { id: 'plot25', left: '62%', top: '72%', width: 99, height: 55 },
    { id: 'plot26', left: '55.9%', top: '66.2%', width: 99, height: 55 },
    { id: 'plot27', left: '45.5%', top: '51.5%', width: 99, height: 55 },
    { id: 'plot28', left: '38.8%', top: '45.5%', width: 99, height: 55 },
    { id: 'plot29', left: '32.2%', top: '39.5%', width: 99, height: 55 },

    { id: 'plot30', left: '56.4%', top: '77.8%', width: 99, height: 55 },
    { id: 'plot31', left: '49.8%', top: '71.8%', width: 99, height: 55 },
    { id: 'plot32', left: '32.8%', top: '56%', width: 99, height: 55 },
    { id: 'plot33', left: '26.2%', top: '49.8%', width: 99, height: 55 },

    { id: 'plot34', left: '50%', top: '83.6%', width: 99, height: 55 },
    { id: 'plot35', left: '43.8%', top: '77.8%', width: 99, height: 55 },
    { id: 'plot36', left: '26.2%', top: '62.8%', width: 99, height: 55 },
    { id: 'plot37', left: '19.6%', top: '56.6%', width: 99, height: 55 },

    { id: 'plot38', left: '43.8%', top: '89.4%', width: 99, height: 55 },
    { id: 'plot39', left: '37.6%', top: '83.6%', width: 99, height: 55 },
    { id: 'plot40', left: '19.6%', top: '69.4%', width: 99, height: 55 },
    { id: 'plot41', left: '13%', top: '63.2%', width: 99, height: 55 },

    { id: 'plot42', left: '37.6%', top: '95.2%', width: 99, height: 55 },
    { id: 'plot43', left: '31.4%', top: '89.4%', width: 99, height: 55 },
    { id: 'plot44', left: '13%', top: '76%', width: 99, height: 55 },
    { id: 'plot45', left: '6.4%', top: '69.8%', width: 99, height: 55 },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/city/base.png)' }}
      />
      
      {plotAreas.map(plot => {
        // Check if this plot has a building
        const buildingArea = buildingAreas.find(area => area.id === plot.id);
        
        if (buildingArea && buildingArea.playerBuilding) {
          // This plot has a building - show the building
          const building = buildingArea.playerBuilding.building;
          const isConstructing = buildingArea.isConstructing;
          
          // Calculate construction progress if building is under construction
          let constructionProgress = 0;
          if (isConstructing && buildingArea.playerBuilding.constructionStartedAt && buildingArea.playerBuilding.constructionEndsAt) {
            const now = new Date().getTime();
            const start = new Date(buildingArea.playerBuilding.constructionStartedAt).getTime();
            const end = new Date(buildingArea.playerBuilding.constructionEndsAt).getTime();
            
            if (now >= end) {
              constructionProgress = 100;
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
                src={`/city/${building.slug}/${cityAge || 1}.png`}
                alt={building.name}
                className={`object-contain ${isConstructing ? 'opacity-70 animate-pulse' : ''}`}
                style={{
                  maxWidth: '99.6%',
                  maxHeight: '99.6%',
                  marginTop: '-10px',
                  marginLeft: '-5px',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: 'transparent'
                }}
                onError={() => {
                  logger.error('CityMap - failed to load image', { 
                    imagePath: `/city/${building.slug}/${cityAge || 1}.png`,
                    buildingData: building,
                    cityAge: cityAge,
                    fullImagePath: `/city/${building.slug}/${cityAge || 1}.png`
                  });
                }}
                onLoad={() => {
                  logger.debug('CityMap - successfully loaded image', { 
                    imagePath: `/city/${building.slug}/${cityAge || 1}.png`
                  });
                }}
              />
              {isConstructing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
                  {/* Construction progress bar */}
                  <div className="w-full max-w-[40%] bg-gray-700 rounded-full h-1 mb-1">
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
          // This plot is empty - show plot image
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
              onClick={() => handlePlotClick(plot.id)}
              title={`Plot ${plot.id.substring(4)}`}
            >
              <img
                src={plotImage}
                alt={`Plot ${plot.id}`}
                className="object-contain"
                style={{
                  width: '100%',
                  height: '100%'
                }}
                onError={() => {
                  logger.error('CityMap - failed to load plot image', { 
                    imagePath: plotImage
                  });
                }}
                onLoad={() => {
                  logger.debug('CityMap - successfully loaded plot image', { 
                    imagePath: plotImage
                  });
                }}
              />
            </div>
          );
        }
      })}
    </div>
  );
});

export default CityMap; 