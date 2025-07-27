'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
  onBuildingSelect
}: BuildingModalProps) {
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${remainingSeconds}s`;
  };

  const handleBuildingClick = (building: Building) => {
    const { canBuild } = checkRequirements(building);
    if (canBuild) {
      onBuildingSelect(building);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-earth-gradient rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-gold shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gold">Build on Plot {plotId.substring(4)}</h2>
          <button
            onClick={onClose}
            className="text-gold-light hover:text-gold text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-gold-light text-center py-8">Loading buildings...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings
              .filter(building => building.fieldType === 0) // Only show city buildings, not resource fields
              .filter(building => {
                // Filter out unique buildings that already exist
                const uniqueBuildings = ['towncenter', 'smith', 'academy', 'market'];
                if (uniqueBuildings.includes(building.slug)) {
                  return !existingBuildings[building.slug]; // Only show if it doesn't exist
                }
                return true; // Show all non-unique buildings
              })
              .map((building) => {
                const { canBuild, reasons } = checkRequirements(building);
                
                return (
                  <div
                    key={building.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      canBuild
                        ? 'border-forest hover:border-gold bg-forest-light hover:bg-forest-lighter'
                        : 'border-forest bg-forest-dark opacity-60'
                    }`}
                    onClick={() => handleBuildingClick(building)}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-12 h-12 bg-forest-dark rounded mr-3 flex items-center justify-center border border-forest">
                        <span className="text-xs text-gold-light">
                          <Image src={`/city/${building.slug}/${cityAge}.png`} alt={building.name} width={48} height={48} />
                        </span>
                      </div>
                      <div>
                        <h3 className="text-gold font-semibold">{building.name}</h3>
                        <p className="text-gold-light text-sm">
                          {building.fieldType === 0 ? 'Building' : 'Resource Field'}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gold-light text-sm mb-2 line-clamp-2">
                      {building.description}
                    </p>
                    
                    <div className="text-gold text-sm mb-2">
                      Cost: {formatCosts(building.costs)}
                    </div>
                    
                    <div className="text-gold-light text-sm mb-2">
                      Construction Time: {formatConstructionTime(building.constructionTime)}
                    </div>
                    
                    {!canBuild && reasons.length > 0 && (
                      <div className="text-red-400 text-xs">
                        {reasons.map((reason, index) => (
                          <div key={index}>• {reason}</div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-gold-light text-xs mt-2">
                      Power: {building.power} | Base: {building.baseValue} | Bonus: {building.bonusValue}
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