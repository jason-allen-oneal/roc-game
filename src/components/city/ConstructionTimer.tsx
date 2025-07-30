'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCity } from '@/contexts/CityContext';
import logger from '@/lib/logger';

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
  building: {
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
  };
}

interface ConstructionProject {
  id: number;
  buildingName: string;
  buildingSlug: string;
  level: number;
  constructionStartedAt: string;
  constructionEndsAt: string;
  cityAge: number;
}

interface ConstructionTimerProps {
  cityId: number;
  refreshTrigger?: number;
  onConstructionComplete?: () => void;
}

const ConstructionTimer = React.memo(function ConstructionTimer({ onConstructionComplete }: ConstructionTimerProps) {
  const { currentCityBuildings } = useCity();
  const [completedBuildings, setCompletedBuildings] = useState<Set<number>>(new Set());
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dismissedRef = useRef(false);
  const prevConstructionCountRef = useRef(0);

  // Real-time timer that updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get ongoing constructions from context
  const constructions: ConstructionProject[] = useMemo(() => {
    const constructingBuildings = currentCityBuildings
      .filter((building: PlayerBuilding) => building.isConstructing && building.constructionStartedAt && building.constructionEndsAt)
      .map((building: PlayerBuilding) => ({
        id: building.id,
        buildingName: building.building.name,
        buildingSlug: building.building.slug,
        level: building.level,
        constructionStartedAt: building.constructionStartedAt!,
        constructionEndsAt: building.constructionEndsAt!,
        cityAge: 1 // Default for now, could be passed as prop
      }));
    
    logger.debug('Construction timer - ongoing constructions', { 
      count: constructingBuildings.length,
      buildingIds: constructingBuildings.map(b => b.id).join(',')
    });
    
    return constructingBuildings;
  }, [currentCityBuildings]);

  // Auto-restore when new constructions start (only when count increases)
  useEffect(() => {
    const currentCount = constructions.length;
    const prevCount = prevConstructionCountRef.current;
    
    // Only auto-restore if there are constructions AND the count increased AND we're currently dismissed
    if (currentCount > 0 && currentCount > prevCount && dismissedRef.current) {
      logger.debug('ConstructionTimer - auto-restoring due to new construction', {
        prevCount,
        currentCount
      });
      dismissedRef.current = false;
      setIsDismissed(false);
    }
    
    // Update the previous count
    prevConstructionCountRef.current = currentCount;
  }, [constructions.length]);

  const handleDismiss = () => {
    dismissedRef.current = true;
    setIsDismissed(true);
  };

  const handleRestore = () => {
    dismissedRef.current = false;
    setIsDismissed(false);
  };

  // Check for completed constructions
  useEffect(() => {
    const checkCompletedConstructions = async () => {
      try {
        const completedConstructions = currentCityBuildings
          .filter((building: PlayerBuilding) => 
            building.isConstructing && 
            building.constructionEndsAt &&
            new Date(building.constructionEndsAt) <= currentTime &&
            !completedBuildings.has(building.id)
          );

        for (const building of completedConstructions) {
          logger.info('ConstructionTimer - construction complete, calling API', { buildingId: building.id });
          
          try {
            // Call the completion API to update the database
            const response = await fetch(`/api/city/${building.cityId}/buildings/${building.id}/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (!response.ok) {
              const errorData = await response.json();
              logger.error('ConstructionTimer - failed to complete construction via API', { 
                buildingId: building.id, 
                error: errorData.error || 'Unknown error'
              });
              continue;
            }

            logger.info('ConstructionTimer - construction completed successfully via API', { buildingId: building.id });
          
          // Mark as completed locally
          setCompletedBuildings(prev => new Set([...prev, building.id]));
          
            // Call the completion callback to refresh city data
          onConstructionComplete?.();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('ConstructionTimer - error calling completion API', { buildingId: building.id, error: errorMessage });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('ConstructionTimer - error checking completed constructions', { error: errorMessage });
      }
    };

    checkCompletedConstructions();
  }, [currentCityBuildings, completedBuildings, onConstructionComplete]);

  // Don't render if no constructions or if dismissed
  if (constructions.length === 0 || isDismissed) {
    return null;
  }

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const diff = end.getTime() - currentTime.getTime();
    
    if (diff <= 0) return 'Complete!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getProgress = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const now = currentTime.getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    return ((now - start) / (end - start)) * 100;
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-earth-gradient border-2 border-gold rounded-lg shadow-xl p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gold-light font-semibold text-sm">Construction Progress</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleDismiss}
              className="text-gold-light hover:text-gold transition-colors text-sm"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {constructions.map((construction) => {
            const progress = getProgress(construction.constructionStartedAt, construction.constructionEndsAt);
            const timeRemaining = formatTimeRemaining(construction.constructionEndsAt);
            
            return (
              <div key={construction.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gold-light text-sm font-medium">
                    {construction.buildingName} (Level {construction.level})
                  </span>
                  <span className="text-gold text-xs w-16 text-right">{timeRemaining}</span>
                </div>
                
                <div className="w-full bg-forest-dark rounded-full h-2">
                  <div 
                    className="bg-gold-gradient h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="text-center">
                  <span className="text-gold text-xs">{Math.round(progress)}%</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {isDismissed && (
          <button
            onClick={handleRestore}
            className="absolute -top-2 -right-2 bg-gold-gradient text-forest-dark rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
            title="Restore construction timer"
          >
            🔨
          </button>
        )}
      </div>
    </div>
  );
});

export default ConstructionTimer; 