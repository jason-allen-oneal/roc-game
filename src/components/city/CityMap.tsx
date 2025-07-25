'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Building {
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
}

export default function CityMap({ cityId, cityAge = 1, onBuildingClick, onPlotClick }: CityMapProps) {
  const [buildingAreas, setBuildingAreas] = useState<BuildingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const plotImage = '/city/plot.png';

  useEffect(() => {
    const fetchCityBuildings = async () => {
      try {
        setLoading(true);
        
        // Fetch player buildings for this city
        const response = await fetch(`/api/city/${cityId}/buildings`);
        if (!response.ok) {
          throw new Error('Failed to fetch city buildings');
        }
        
        const playerBuildings: PlayerBuilding[] = await response.json();
        console.log('Fetched player buildings:', playerBuildings);
        
        // Create building areas from player buildings
        const areas: BuildingArea[] = [];
        
        playerBuildings.forEach((playerBuilding) => {
          console.log('Processing building:', playerBuilding.building.slug, playerBuilding.building.name);
          // Special case: Town Center always goes on plot 27
          if (playerBuilding.building.slug === 'towncenter') {
            areas.push({
              id: 'plot27',
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
          } else {
            // For other buildings, we'll need to determine plot assignment
            // For now, we'll create a generic area
            areas.push({
              id: `building-${playerBuilding.id}`,
              name: playerBuilding.building.name,
              x: 0,
              y: 0,
              width: 99,
              height: 55,
              buildingType: playerBuilding.building.slug,
              level: playerBuilding.level,
              isConstructing: playerBuilding.isConstructing,
              playerBuilding: playerBuilding
            });
          }
        });
        
        console.log('Created building areas:', areas);
        setBuildingAreas(areas);
      } catch (error) {
        console.error('Error fetching city buildings:', error);
        setBuildingAreas([]);
      } finally {
        setLoading(false);
      }
    };

    if (cityId) {
      fetchCityBuildings();
    }
  }, [cityId]);

  const handleAreaClick = (areaId: string) => {
    console.log(`Clicked on ${areaId}`);
    onBuildingClick?.(areaId);
  };

  const handlePlotClick = (areaId: string) => {
    console.log(`Clicked on ${areaId}`);
    onPlotClick?.(areaId);
  };

  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-white">Loading city...</div>
      </div>
    );
  }

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
    { id: 'plot36', left: '35%', top: '70%', width: 99, height: 55 },
    { id: 'plot37', left: '26.8%', top: '62.4%', width: 99, height: 55 },
    { id: 'plot38', left: '21%', top: '56%', width: 99, height: 55 },

    { id: 'plot39', left: '44.6%', top: '89.6%', width: 99, height: 55 },
    { id: 'plot40', left: '38.4%', top: '83.6%', width: 99, height: 55 },
    { id: 'plot41', left: '29.8%', top: '75.6%', width: 99, height: 55 },
    { id: 'plot42', left: '20.8%', top: '67.6%', width: 99, height: 55 },
    { id: 'plot43', left: '14.8%', top: '62%', width: 99, height: 55 },
  ];

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div className="relative" style={{ width: '840px', height: '476px' }}>
      {/* Base city image as background */}
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
              onClick={() => handleAreaClick(plot.id)}
              title={`${building.name} (Level ${buildingArea.level})${isConstructing ? ' - Constructing' : ''}`}
            >
              <Image
                src={`/city/${building.slug}/${cityAge || 1}.png`}
                alt={building.name}
                width={plot.width}
                height={plot.height}
                className={`object-contain ${isConstructing ? 'opacity-50' : ''}`}
                style={{
                  maxWidth: '99.6%',
                  maxHeight: '99.6%',
                  marginTop: '-10px',
                  marginLeft: '-5px'
                }}
              />
              {isConstructing && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                  <div className="text-white text-xs font-bold">BUILDING</div>
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
              title={`Plot ${plot.id}`}
            >
              <Image
                src={plotImage}
                alt={`Plot ${plot.id}`}
                width={plot.width}
                height={plot.height}
                className="object-contain"
              />
            </div>
          );
        }
      })}
      </div>
    </div>
  );
} 