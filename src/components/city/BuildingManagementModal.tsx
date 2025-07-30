'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  TownCenter, 
  Barracks, 
  Market, 
  Academy, 
  Smith, 
  Tower, 
  GenericBuilding 
} from './buildings';

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
  level: number;
  isConstructing: boolean;
  constructionStartedAt: string | null;
  constructionEndsAt: string | null;
  building: Building;
}

interface BuildingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: PlayerBuilding | null;
  cityId: number;
  cityResources: {
    food: number;
    wood: number;
    stone: number;
    ore: number;
    gold: number;
  };
  cityAge: number;
  cityBuildings: Array<{
    building: {
      slug: string;
    };
    level: number;
  }>;
  existingResearch?: { [key: string]: number };
  onUpgrade?: (buildingId: number) => void;
  onDemolish?: (buildingId: number) => void;
  onResearchStart?: () => void;
}

export default function BuildingManagementModal({
  isOpen,
  onClose,
  building,
  cityId,
  cityResources,
  cityAge,
  cityBuildings,
  existingResearch,
  onUpgrade,
  onDemolish,
  onResearchStart
}: BuildingManagementModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !building) return null;

  const buildingData = building.building;
  const isConstructing = building.isConstructing;

  const getBuildingSpecificContent = () => {
    const props = {
      level: building.level,
      cityAge,
      name: buildingData.name,
      description: buildingData.description
    };

    switch (buildingData.slug) {
      case 'towncenter':
        return <TownCenter level={props.level} cityAge={props.cityAge} />;
      case 'barracks':
        return <Barracks level={props.level} />;
      case 'market':
        return <Market level={props.level} />;
      case 'academy':
        return <Academy 
          level={props.level} 
          cityId={cityId}
          cityResources={cityResources}
          cityAge={cityAge}
          cityBuildings={cityBuildings}
          existingResearch={existingResearch || {}}
          onResearchStart={onResearchStart}
          onClose={onClose}
        />;
      case 'smith':
        return <Smith level={props.level} />;
      case 'tower':
        return <Tower level={props.level} cityId={cityId} onClose={onClose} />;
      default:
        return <GenericBuilding name={props.name} level={props.level} description={props.description} />;
    }
  };

  const getUpgradeCosts = () => {
    const baseCosts = buildingData.costs || {};
    const level = building.level;
    
    // Increase costs by 50% per level
    const multiplier = 1 + (level * 0.5);
    
    return {
      food: Math.floor((baseCosts.f || 0) * multiplier),
      wood: Math.floor((baseCosts.w || 0) * multiplier),
      stone: Math.floor((baseCosts.s || 0) * multiplier),
      ore: Math.floor((baseCosts.o || 0) * multiplier),
      gold: Math.floor((baseCosts.g || 0) * multiplier)
    };
  };

  const upgradeCosts = getUpgradeCosts();
  const canUpgrade = cityResources.food >= upgradeCosts.food &&
                    cityResources.wood >= upgradeCosts.wood &&
                    cityResources.stone >= upgradeCosts.stone &&
                    cityResources.ore >= upgradeCosts.ore &&
                    cityResources.gold >= upgradeCosts.gold;

  const handleUpgrade = async () => {
    if (!canUpgrade || isConstructing) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/city/${cityId}/buildings/${building.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade building');
      }

      onUpgrade?.(building.id);
      onClose();
    } catch (error) {
      console.error('Error upgrading building:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemolish = async () => {
    if (isConstructing) return;
    
    if (!confirm(`Are you sure you want to demolish ${buildingData.name}? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/city/${cityId}/buildings/${building.id}/demolish`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to demolish building');
      }

      onDemolish?.(building.id);
      onClose();
    } catch (error) {
      console.error('Error demolishing building:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-earth-gradient rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gold shadow-2xl">
        {/* Header */}
        <div className="bg-forest-gradient text-gold-light p-6 border-b border-gold">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-forest-dark bg-opacity-80 rounded-lg flex items-center justify-center border border-forest">
                <Image
                  src={`/city/${buildingData.slug}/${cityAge}.png`}
                  alt={buildingData.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gold">{buildingData.name}</h2>
                <p className="text-sm text-gold-light">Level {building.level}</p>
                {isConstructing && (
                  <span className="inline-block bg-gold text-forest-dark px-2 py-1 rounded text-xs mt-1 font-semibold">
                    Under Construction
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gold-light hover:text-gold text-2xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-forest-dark">
          <div className="space-y-6">
            {/* Building Information */}
            <div>
              <h3 className="text-base font-semibold text-gold mb-3">Building Information</h3>
              <p className="text-sm text-gold-light mb-4">{buildingData.description}</p>
            </div>

            {/* Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upgrade Section */}
              <div className="bg-forest-light p-4 rounded-lg border border-forest">
                <h4 className="text-sm font-semibold text-gold mb-3">Upgrade to Level {building.level + 1}</h4>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gold-light">Food:</span>
                    <span className={`text-xs ${cityResources.food >= upgradeCosts.food ? 'text-gold-light' : 'text-red-400'}`}>
                      {cityResources.food} / {upgradeCosts.food}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gold-light">Wood:</span>
                    <span className={`text-xs ${cityResources.wood >= upgradeCosts.wood ? 'text-gold-light' : 'text-red-400'}`}>
                      {cityResources.wood} / {upgradeCosts.wood}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gold-light">Stone:</span>
                    <span className={`text-xs ${cityResources.stone >= upgradeCosts.stone ? 'text-gold-light' : 'text-red-400'}`}>
                      {cityResources.stone} / {upgradeCosts.stone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gold-light">Ore:</span>
                    <span className={`text-xs ${cityResources.ore >= upgradeCosts.ore ? 'text-gold-light' : 'text-red-400'}`}>
                      {cityResources.ore} / {upgradeCosts.ore}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gold-light">Gold:</span>
                    <span className={`text-xs ${cityResources.gold >= upgradeCosts.gold ? 'text-gold-light' : 'text-red-400'}`}>
                      {cityResources.gold} / {upgradeCosts.gold}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={!canUpgrade || isConstructing || loading}
                  className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
                    canUpgrade && !isConstructing && !loading
                      ? 'bg-gold-gradient text-forest-dark hover:opacity-90'
                      : 'bg-forest text-gold-light cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Upgrading...' : `Upgrade to Level ${building.level + 1}`}
                </button>
              </div>

              {/* Demolish Section */}
              <div className="bg-forest p-4 rounded-lg border border-forest">
                <h4 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h4>
                <p className="text-xs text-gold-light mb-4">
                  Demolishing this building will permanently remove it and return some resources.
                </p>
                <button
                  onClick={handleDemolish}
                  disabled={isConstructing || loading}
                  className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
                    !isConstructing && !loading
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-forest text-gold-light cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Demolishing...' : 'Demolish Building'}
                </button>
              </div>
            </div>

            {/* Building Specific Content */}
            <div>
              {getBuildingSpecificContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 