'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

interface Research {
  id: number;
  name: string;
  slug: string;
  description: string;
  costs: Record<string, number>;
  requirements: Record<string, unknown>;
  power: number;
  baseValue: number;
  bonusValue: number;
}

interface AcademyProps {
  level: number;
  cityId: number;
  cityResources: {
    food: number;
    wood: number;
    stone: number;
    ore: number;
    gold: number;
  };
  existingResearch: { [key: string]: number };
  cityAge: number;
  cityBuildings: Array<{
    building: {
      slug: string;
    };
    level: number;
  }>;
  onResearchStart?: () => void;
  onClose?: () => void;
}

export default function Academy({ 
  level, 
  cityId, 
  cityResources, 
  existingResearch,
  cityAge,
  cityBuildings,
  onResearchStart,
  onClose
}: AcademyProps) {
  const [research, setResearch] = useState<Research[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);

  // Fetch available research
  useEffect(() => {
    const fetchResearch = async () => {
      try {
        const response = await fetch('/api/research');
        if (response.ok) {
          const data = await response.json();
          setResearch(data);
        }
      } catch (error) {
        logger.error('Academy - error fetching research', { error: String(error) });
      }
    };

    fetchResearch();
  }, []);

  const handleStartResearch = async (researchItem: Research) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/city/${cityId}/research/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ researchId: researchItem.id })
      });

      if (response.ok) {
        logger.debug('Academy - research started successfully', { researchId: researchItem.id });
        onResearchStart?.();
        setSelectedResearch(null);
        // Refresh the research list to show updated status
        const researchResponse = await fetch('/api/research');
        if (researchResponse.ok) {
          const researchData = await researchResponse.json();
          setResearch(researchData);
        }
        // Close the modal after successful research start
        onClose?.();
      } else {
        const error = await response.json();
        alert(`Failed to start research: ${error.error}`);
      }
    } catch (error) {
      logger.error('Academy - error starting research', { error: String(error) });
      alert('Failed to start research');
    } finally {
      setLoading(false);
    }
  };

  const isResearchCompleted = (researchSlug: string) => {
    return existingResearch[researchSlug] && existingResearch[researchSlug] > 0;
  };

  const isResearchInProgress = () => {
    // TODO: This should check against active research from the timer
    // For now, we'll assume research is not in progress
    // This will be fixed when we integrate with the ResearchTimer data
    return false;
  };

  const getResearchLevel = (researchSlug: string) => {
    return existingResearch[researchSlug] || 0;
  };

  const canUpgradeResearch = (researchSlug: string) => {
    const currentLevel = getResearchLevel(researchSlug);
    return currentLevel > 0 && currentLevel < 25;
  };

  const canAffordResearch = (costs: Record<string, number>) => {
    return cityResources.food >= (costs.f || 0) &&
           cityResources.wood >= (costs.w || 0) &&
           cityResources.stone >= (costs.s || 0) &&
           cityResources.ore >= (costs.o || 0) &&
           cityResources.gold >= (costs.g || 0);
  };

  const canMeetResearchRequirements = (requirements: Record<string, unknown>) => {
    if (!requirements) return true;

    // Check age requirement
    if (requirements.age && cityAge < (requirements.age as number)) {
      return false;
    }

    // Check building requirements
    if (requirements.buildings) {
      const buildingReqs = requirements.buildings as Record<string, number>;
      for (const [buildingSlug, requiredLevel] of Object.entries(buildingReqs)) {
        const building = cityBuildings.find(b => b.building.slug === buildingSlug);
        if (!building || building.level < requiredLevel) {
          return false;
        }
      }
    }

    // Check research requirements
    if (requirements.research) {
      const researchReqs = requirements.research as Record<string, number>;
      for (const [researchSlug, requiredLevel] of Object.entries(researchReqs)) {
        const currentLevel = existingResearch[researchSlug] || 0;
        if (currentLevel < requiredLevel) {
          return false;
        }
      }
    }

    return true;
  };

  const getResearchRequirementsText = (requirements: Record<string, unknown>) => {
    if (!requirements) return null;

    const requirementsText: string[] = [];

    // Age requirement
    if (requirements.age) {
      requirementsText.push(`City Age: ${requirements.age}`);
    }

    // Building requirements
    if (requirements.buildings) {
      const buildingReqs = requirements.buildings as Record<string, number>;
      for (const [buildingSlug, requiredLevel] of Object.entries(buildingReqs)) {
        requirementsText.push(`${buildingSlug.charAt(0).toUpperCase() + buildingSlug.slice(1)} Level: ${requiredLevel}`);
      }
    }

    // Research requirements
    if (requirements.research) {
      const researchReqs = requirements.research as Record<string, number>;
      for (const [researchSlug, requiredLevel] of Object.entries(researchReqs)) {
        requirementsText.push(`${researchSlug.charAt(0).toUpperCase() + researchSlug.slice(1)} Level: ${requiredLevel}`);
      }
    }

    return requirementsText.length > 0 ? requirementsText.join(', ') : null;
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-800 mb-2">Research Center</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Research Slots:</span>
            <span className="font-medium">{level}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-3">Available Research</h4>
        <div className="grid grid-cols-2 gap-3">
          {research.map((researchItem) => {
            const isCompleted = isResearchCompleted(researchItem.slug);
            const isInProgress = isResearchInProgress();
            const currentLevel = getResearchLevel(researchItem.slug);
            const targetLevel = currentLevel === 0 ? 1 : currentLevel + 1;
            const canUpgrade = canUpgradeResearch(researchItem.slug);
            const canAfford = canAffordResearch(researchItem.costs || {});
            const canMeetRequirements = canMeetResearchRequirements(researchItem.requirements || {});
            const canStart = (currentLevel === 0 || canUpgrade) && canAfford && canMeetRequirements;
            const requirementsText = getResearchRequirementsText(researchItem.requirements || {});

            return (
              <div 
                key={researchItem.id} 
                className={`p-3 rounded-lg border ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : isInProgress 
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{researchItem.name}</h5>
                    <p className="text-xs text-gray-600 mt-1">{researchItem.description}</p>
                    {/* Show research bonus */}
                    <div className="text-xs text-blue-600 mt-1">
                      {researchItem.slug === 'architecture' && (
                        <span>Construction Speed: +{researchItem.baseValue}% per level</span>
                      )}
                      {researchItem.slug === 'farming' && (
                        <span>Food Production: +{researchItem.baseValue}% per level</span>
                      )}
                      {researchItem.slug === 'woodworking' && (
                        <span>Wood Production: +{researchItem.baseValue}% per level</span>
                      )}
                      {researchItem.slug === 'mining' && (
                        <span>Stone/Ore Production: +{researchItem.baseValue}% per level</span>
                      )}
                      {researchItem.slug === 'conscription' && (
                        <span>Training Speed: +{researchItem.baseValue}% per level</span>
                      )}
                    </div>
                    {/* Show requirements if any */}
                    {requirementsText && (
                      <div className="text-xs text-orange-600 mt-1">
                        <span className="font-medium">Requirements: {requirementsText}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {currentLevel > 0 && (
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Level {currentLevel}/25
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Researching...
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Level */}
                {canStart && !isInProgress && (
                  <div className="text-xs text-blue-600 mb-2">
                    <span className="font-medium">Next Level: {targetLevel}</span>
                  </div>
                )}

                {/* Costs */}
                <div className="text-xs text-gray-500 mb-3">
                  <span className="text-xs font-medium">Costs:</span>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {researchItem.costs?.f && (
                      <span className={`${cityResources.food >= researchItem.costs.f ? 'text-green-600' : 'text-red-600'}`}>
                        Food: {cityResources.food}/{researchItem.costs.f}
                      </span>
                    )}
                    {researchItem.costs?.w && (
                      <span className={`${cityResources.wood >= researchItem.costs.w ? 'text-green-600' : 'text-red-600'}`}>
                        Wood: {cityResources.wood}/{researchItem.costs.w}
                      </span>
                    )}
                    {researchItem.costs?.s && (
                      <span className={`${cityResources.stone >= researchItem.costs.s ? 'text-green-600' : 'text-red-600'}`}>
                        Stone: {cityResources.stone}/{researchItem.costs.s}
                      </span>
                    )}
                    {researchItem.costs?.o && (
                      <span className={`${cityResources.ore >= researchItem.costs.o ? 'text-green-600' : 'text-red-600'}`}>
                        Ore: {cityResources.ore}/{researchItem.costs.o}
                      </span>
                    )}
                    {researchItem.costs?.g && (
                      <span className={`${cityResources.gold >= researchItem.costs.g ? 'text-green-600' : 'text-red-600'}`}>
                        Gold: {cityResources.gold}/{researchItem.costs.g}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {!isInProgress && (
                  <button
                    onClick={() => handleStartResearch(researchItem)}
                    disabled={!canStart || loading}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors ${
                      canStart && !loading
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Starting...' : currentLevel === 0 ? 'Start Research' : `Upgrade to Level ${targetLevel}`}
                  </button>
                )}
                {/* Show why research can't be started */}
                {!isInProgress && !canStart && (
                  <div className="text-xs text-red-600 mt-2">
                    {!canAfford && <div>Insufficient resources</div>}
                    {!canMeetRequirements && requirementsText && <div>Missing requirements</div>}
                    {currentLevel >= 25 && <div>Research at maximum level</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 