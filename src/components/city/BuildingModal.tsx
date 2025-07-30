'use client';

import React, { useState, useEffect } from 'react';

interface Building {
  id: number;
  name: string;
  slug: string;
  fieldType: number;
  description: string;
  costs: {
    f?: number; // food
    w?: number; // wood
    s?: number; // stone
    o?: number; // ore
    g?: number; // gold
  };
  requirements: {
    age?: number;
    buildings?: { [key: string]: number };
    research?: { [key: string]: number };
  };
  power: number;
  baseValue: number;
  bonusValue: number;
  constructionTime: number; // Construction time in seconds
}

interface CityResources {
  food: number;
  wood: number;
  stone: number;
  ore: number;
  gold: number;
}

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plotId: string;
  cityId: number;
  cityResources: CityResources;
  cityAge: number;
  existingBuildings: { [key: string]: number }; // building slug -> level
  existingResearch: { [key: string]: number }; // research slug -> level
  onBuildingSelect: (building: Building) => void;
  isResourceBuilding?: boolean; // Optional prop to filter for resource buildings only
  towncenterLevel?: number; // Optional prop for field view to show towncenter level
  availableFieldPlots?: number; // Optional prop for field view to show available plots
}

export default function BuildingModal({
  isOpen,
  onClose,
  plotId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cityId,
  cityResources,
  cityAge,
  existingBuildings,
  existingResearch,
  onBuildingSelect,
  isResourceBuilding = false,
  towncenterLevel,
  availableFieldPlots
}: BuildingModalProps) {
  console.log('BuildingModal rendered with isResourceBuilding:', isResourceBuilding);
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/buildings');
        if (!response.ok) {
          throw new Error('Failed to fetch buildings');
        }
        const buildingData: Building[] = await response.json();
        setBuildings(buildingData);
      } catch (error) {
        console.error('Error fetching buildings:', error);
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchBuildings();
    }
  }, [isOpen]);

  const checkRequirements = (building: Building): { canBuild: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    
    // Check age requirement
    if (building.requirements.age && cityAge < building.requirements.age) {
      reasons.push(`Requires Age ${building.requirements.age}`);
    }
    
    // Check building requirements
    if (building.requirements.buildings) {
      for (const [buildingSlug, requiredLevel] of Object.entries(building.requirements.buildings)) {
        const currentLevel = existingBuildings[buildingSlug] || 0;
        if (currentLevel < requiredLevel) {
          reasons.push(`Requires ${buildingSlug} level ${requiredLevel}`);
        }
      }
    }
    
    // Check research requirements
    if (building.requirements.research) {
      for (const [researchSlug, requiredLevel] of Object.entries(building.requirements.research)) {
        const currentLevel = existingResearch[researchSlug] || 0;
        if (currentLevel < requiredLevel) {
          reasons.push(`Requires ${researchSlug} research level ${requiredLevel}`);
        }
      }
    }
    
    // Check resource requirements
    if (building.costs) {
      if (building.costs.f && cityResources.food < building.costs.f) {
        reasons.push(`Insufficient Food (${cityResources.food}/${building.costs.f})`);
      }
      if (building.costs.w && cityResources.wood < building.costs.w) {
        reasons.push(`Insufficient Wood (${cityResources.wood}/${building.costs.w})`);
      }
      if (building.costs.s && cityResources.stone < building.costs.s) {
        reasons.push(`Insufficient Stone (${cityResources.stone}/${building.costs.s})`);
      }
      if (building.costs.o && cityResources.ore < building.costs.o) {
        reasons.push(`Insufficient Ore (${cityResources.ore}/${building.costs.o})`);
      }
      if (building.costs.g && cityResources.gold < building.costs.g) {
        reasons.push(`Insufficient Gold (${cityResources.gold}/${building.costs.g})`);
      }
    }
    
    return {
      canBuild: reasons.length === 0,
      reasons
    };
  };

  const formatCosts = (costs: Building['costs']) => {
    const costStrings: string[] = [];
    if (costs.f) costStrings.push(`${costs.f} Food`);
    if (costs.w) costStrings.push(`${costs.w} Wood`);
    if (costs.s) costStrings.push(`${costs.s} Stone`);
    if (costs.o) costStrings.push(`${costs.o} Ore`);
    if (costs.g) costStrings.push(`${costs.g} Gold`);
    return costStrings.join(', ');
  };

  const formatConstructionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleBuildingClick = (building: Building) => {
    const requirements = checkRequirements(building);
    if (requirements.canBuild) {
      onBuildingSelect(building);
      onClose();
    } else {
      alert(`Cannot build ${building.name}:\n${requirements.reasons.join('\n')}`);
    }
  };



  // Temporary hardcoded paths for testing
  const getHardcodedFieldPath = (buildingSlug: string, cityAge: number) => {
    const paths = {
      'farm': `/field/food/${cityAge}.png`,
      'lumbermill': `/field/wood/${cityAge}.png`,
      'quarry': `/field/stone/${cityAge}.png`,
      'mine': `/field/ore/${cityAge}.png`
    };
    return paths[buildingSlug as keyof typeof paths] || `/field/food/${cityAge}.png`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-earth-gradient rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-gold shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gold">
            {isResourceBuilding 
              ? `Build Resource Field on Plot ${plotId.substring(5)} (Town Center Level ${towncenterLevel || 1}, ${availableFieldPlots || 0} plots available)`
              : `Build on Plot ${plotId.substring(4)}`
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gold-light hover:text-gold text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gold">Loading buildings...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings
              .filter(building => building.fieldType === 0) // Only show city buildings, not resource fields
              .filter(building => {
                if (isResourceBuilding) {
                  // For resource building modal, only show resource buildings
                  const resourceBuildings = ['farm', 'lumbermill', 'quarry', 'mine'];
                  return resourceBuildings.includes(building.slug);
                } else {
                  // For city building modal, filter out resource buildings and unique buildings
                  const resourceBuildings = ['farm', 'lumbermill', 'quarry', 'mine'];
                  if (resourceBuildings.includes(building.slug)) {
                    return false; // Don't show resource buildings in city
                  }
                  
                  // Filter out unique buildings that already exist
                  const uniqueBuildings = ['towncenter', 'smith', 'academy', 'market', 'arena', 'wall', 'tower'];
                  if (uniqueBuildings.includes(building.slug)) {
                    return !existingBuildings[building.slug]; // Only show if it doesn't exist
                  }
                  return true; // Show all non-unique buildings
                }
              })
              .map((building) => {
                const requirements = checkRequirements(building);
                const canBuild = requirements.canBuild;
                
                return (
                  <div
                    key={building.id}
                    onClick={() => handleBuildingClick(building)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      canBuild
                        ? 'border-gold bg-forest-dark hover:bg-forest hover:border-gold-light'
                        : 'border-gray-600 bg-gray-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-forest-dark rounded mr-3 flex items-center justify-center border border-forest">
                        <span className="text-xs text-gold-light">
                          {(() => {
                            const imagePath = isResourceBuilding ? getHardcodedFieldPath(building.slug, cityAge) : `/city/${building.slug}/${cityAge}.png`;
                            
                            return (
                              <img 
                                src={imagePath}
                                alt={building.name} 
                                width={48} 
                                height={48}
                                style={{ objectFit: 'contain' }}
                                onError={() => {
                                  console.error('Failed to load building image:', {
                                    src: imagePath,
                                    building: building.slug,
                                    isResourceBuilding,
                                    cityAge,
                                    finalPath: imagePath
                                  });
                                }}
                                onLoad={() => {
                                  console.log('Successfully loaded building image:', {
                                    src: imagePath,
                                    building: building.slug,
                                    isResourceBuilding,
                                    cityAge,
                                    finalPath: imagePath
                                  });
                                }}
                              />
                            );
                          })()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div>
                          <h3 className="text-gold font-semibold">{building.name}</h3>
                          <p className="text-gold-light text-sm">
                            {isResourceBuilding ? 'Resource Field' : (building.fieldType === 0 ? 'Building' : 'Resource Field')}
                          </p>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gold-light">
                            <span className="font-semibold">Cost:</span> {formatCosts(building.costs)}
                          </p>
                          <p className="text-xs text-gold-light">
                            <span className="font-semibold">Time:</span> {formatConstructionTime(building.constructionTime)}
                          </p>
                          {building.baseValue > 0 && (
                            <p className="text-xs text-gold-light">
                              <span className="font-semibold">Production:</span> {building.baseValue} + {building.bonusValue} per level
                            </p>
                          )}
                          {building.power > 0 && (
                            <p className="text-xs text-gold-light">
                              <span className="font-semibold">Power:</span> {building.power}
                            </p>
                          )}
                        </div>
                        
                        {!canBuild && requirements.reasons.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-red-400 font-semibold">Requirements not met:</p>
                            <ul className="text-xs text-red-300 mt-1">
                              {requirements.reasons.map((reason, index) => (
                                <li key={index}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
} 