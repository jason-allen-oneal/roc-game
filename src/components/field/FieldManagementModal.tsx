'use client';

import { useState } from 'react';
import Image from 'next/image';

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

interface CityResources {
  food: number;
  wood: number;
  stone: number;
  ore: number;
  gold: number;
}

interface FieldManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: PlayerBuilding;
  cityId: number;
  cityResources: CityResources;
  cityAge: number;
  onUpgrade?: (buildingId: number) => void;
  onDemolish?: (buildingId: number) => void;
}

export default function FieldManagementModal({
  isOpen,
  onClose,
  building,
  cityId,
  cityResources,
  cityAge,
  onUpgrade,
  onDemolish
}: FieldManagementModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !building) return null;

  const buildingData = building.building;
  const isConstructing = building.isConstructing;

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
        throw new Error('Failed to upgrade resource field');
      }

      onUpgrade?.(building.id);
      onClose();
    } catch (error) {
      console.error('Error upgrading resource field:', error);
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
        throw new Error('Failed to demolish resource field');
      }

      onDemolish?.(building.id);
      onClose();
    } catch (error) {
      console.error('Error demolishing resource field:', error);
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
                  src={`/field/${buildingData.slug}/${cityAge}.png`}
                  alt={buildingData.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gold">{buildingData.name}</h2>
                <p className="text-gold-light">Level {building.level}</p>
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
        <div className="p-6 space-y-6">
          {/* Resource Field Overview */}
          <div className="bg-forest p-4 rounded-lg border border-gold">
            <h4 className="font-semibold text-gold-light mb-2">Resource Field Overview</h4>
            <div className="space-y-2 text-sm text-gold-light">
              <div className="flex justify-between">
                <span>Current Level:</span>
                <span className="font-medium text-gold">{building.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Field Type:</span>
                <span className="font-medium text-gold">{buildingData.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Production:</span>
                <span className="font-medium text-gold">{buildingData.baseValue}</span>
              </div>
              <div className="flex justify-between">
                <span>Bonus per Level:</span>
                <span className="font-medium text-gold">{buildingData.bonusValue}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Production:</span>
                <span className="font-medium text-gold">
                  {buildingData.baseValue + (buildingData.bonusValue * (building.level - 1))}
                </span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="bg-forest-light p-4 rounded-lg border border-gold">
            <h4 className="font-semibold text-gold-light mb-2">Description</h4>
            <p className="text-sm text-gold-light">{buildingData.description}</p>
          </div>

          {/* Upgrade Section */}
          {!isConstructing && (
            <div className="bg-forest p-4 rounded-lg border border-gold">
              <h4 className="font-semibold text-gold-light mb-3">Upgrade Resource Field</h4>
              
              <div className="space-y-3">
                <div className="text-sm text-gold-light">
                  <p className="mb-2">Upgrade to Level {building.level + 1} for increased production:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Food: {upgradeCosts.food}</div>
                    <div>Wood: {upgradeCosts.wood}</div>
                    <div>Stone: {upgradeCosts.stone}</div>
                    <div>Ore: {upgradeCosts.ore}</div>
                    <div>Gold: {upgradeCosts.gold}</div>
                  </div>
                </div>
                
                <button
                  onClick={handleUpgrade}
                  disabled={!canUpgrade || loading}
                  className={`w-full py-2 px-4 rounded font-semibold transition-all ${
                    canUpgrade
                      ? 'bg-gold-gradient text-forest-dark hover:opacity-90'
                      : 'bg-forest-dark text-gold-light opacity-50 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Upgrading...' : `Upgrade to Level ${building.level + 1}`}
                </button>
              </div>
            </div>
          )}

          {/* Demolish Section */}
          {!isConstructing && (
            <div className="bg-forest-dark p-4 rounded-lg border border-red-500">
              <h4 className="font-semibold text-red-400 mb-2">Danger Zone</h4>
              <p className="text-sm text-gold-light mb-3">
                Demolishing this resource field will permanently remove it and you will lose all production from this field.
              </p>
              <button
                onClick={handleDemolish}
                disabled={loading}
                className="w-full py-2 px-4 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Demolishing...' : 'Demolish Resource Field'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 