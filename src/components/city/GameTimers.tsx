'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

interface PlayerBuilding {
  id: number;
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
  };
}

interface PlayerResearch {
  id: number;
  researchId: number;
  level: number;
  isResearching: boolean;
  researchStartedAt: string | null;
  researchEndsAt: string | null;
  research: {
    id: number;
    name: string;
    slug: string;
  };
}

interface GameTimersProps {
  cityId: number;
  onConstructionComplete?: () => void;
  onResearchComplete?: () => void;
}

export default function GameTimers({ cityId, onConstructionComplete, onResearchComplete }: GameTimersProps) {
  const [constructingItems, setConstructingItems] = useState<PlayerBuilding[]>([]);
  const [researchingItems, setResearchingItems] = useState<PlayerResearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch all timer items from unified poll
  useEffect(() => {
    const fetchTimerItems = async () => {
      try {
        const response = await fetch(`/api/city/${cityId}/poll`);
        if (response.ok) {
          const data = await response.json();
          setConstructingItems(data.timers?.constructing || []);
          setResearchingItems(data.timers?.research || []);
        } else {
          logger.error('GameTimers - failed to fetch timer items', { status: response.status });
        }
      } catch (error) {
        logger.error('GameTimers - error fetching timer items', { error: String(error) });
      }
    };

    fetchTimerItems();
    
    // Poll every second for updates
    const interval = setInterval(fetchTimerItems, 1000);
    
    return () => clearInterval(interval);
  }, [cityId]);

  const handleConstructionComplete = async (buildingId: number) => {
    setLoading(true);
    try {
      logger.debug('GameTimers - attempting to complete construction', { buildingId, cityId });
      
      const response = await fetch(`/api/city/${cityId}/buildings/${buildingId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        logger.debug('GameTimers - construction completed successfully', { 
          buildingId, 
          result,
          constructingItemsCount: constructingItems.length
        });
        onConstructionComplete?.();
        
        // Remove the completed building from the list
        setConstructingItems(prev => {
          const filtered = prev.filter(item => item.id !== buildingId);
          logger.debug('GameTimers - updated constructing items', { 
            previousCount: prev.length, 
            newCount: filtered.length 
          });
          return filtered;
        });
        
        // Also remove from allItems to ensure it disappears immediately
        setResearchingItems(prev => prev); // Trigger re-render
      } else {
        const error = await response.json();
        logger.error('GameTimers - error completing construction', { buildingId, error });
      }
    } catch (error) {
      logger.error('GameTimers - error completing construction', { buildingId, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleResearchComplete = async (researchId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/city/${cityId}/research/${researchId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        logger.debug('GameTimers - research completed successfully', { researchId });
        onResearchComplete?.();
        
        // Remove the completed research from the list
        setResearchingItems(prev => prev.filter(item => item.researchId !== researchId));
        
        // Also trigger re-render to ensure it disappears immediately
        setConstructingItems(prev => prev); // Trigger re-render
      } else {
        const error = await response.json();
        logger.error('GameTimers - error completing research', { researchId, error });
      }
    } catch (error) {
      logger.error('GameTimers - error completing research', { researchId, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (endsAt: string | null, startedAt: string | null) => {
    if (!endsAt || !startedAt) return 0;
    
    const now = new Date().getTime();
    const start = new Date(startedAt).getTime();
    const end = new Date(endsAt).getTime();
    const total = end - start;
    const elapsed = now - start;
    
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const getTimeRemaining = (endsAt: string | null) => {
    if (!endsAt) return 0;
    
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const remaining = Math.max(0, Math.floor((end - now) / 1000));
    
    return remaining;
  };

  const isActuallyComplete = (endsAt: string | null) => {
    if (!endsAt) return false;
    
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    return now >= end;
  };

  const allItems = [
    ...constructingItems.map(item => ({ ...item, type: 'construction' as const })),
    ...researchingItems.map(item => ({ ...item, type: 'research' as const }))
  ];

  // Force re-render when items change
  const itemsKey = allItems.map(item => `${item.type}-${item.type === 'construction' ? item.id : item.researchId}`).join('-');

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div key={itemsKey} className="fixed bottom-6 left-6 z-50">
      {/* Show/Hide Button */}
      {allItems.length > 0 && (
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="mb-2 bg-gradient-to-r from-gold to-yellow-500 text-gray-900 px-3 py-2 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          {isVisible ? '🔽 Hide Timers' : '🔼 Show Timers'}
        </button>
      )}
      
      {allItems.length > 0 && isVisible && (
        <div 
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gold/50 rounded-xl p-5 shadow-2xl backdrop-blur-sm"
          style={{
            width: '300px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.1)',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 50%, rgba(17, 24, 39, 0.95) 100%)'
          }}
        >
          {/* Timer Items */}
          <div className="space-y-3">
            {allItems.map((item) => {
              const timeRemaining = getTimeRemaining(item.type === 'construction' ? item.constructionEndsAt : item.researchEndsAt);
              const progress = getProgress(
                item.type === 'construction' ? item.constructionEndsAt : item.researchEndsAt,
                item.type === 'construction' ? item.constructionStartedAt : item.researchStartedAt
              );
              const isComplete = isActuallyComplete(item.type === 'construction' ? item.constructionEndsAt : item.researchEndsAt);
              const isConstruction = item.type === 'construction';
              const itemName = isConstruction ? item.building.name : item.research.name;
              const itemId = isConstruction ? item.id : item.researchId;

              return (
                <div
                  key={`${item.type}-${itemId}`}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${
                        isConstruction 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse' 
                          : 'bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse'
                      }`} />
                      <div>
                        <h5 className="text-white font-semibold text-sm">
                          {itemName}
                        </h5>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          isConstruction 
                            ? 'bg-yellow-900/30 text-yellow-300' 
                            : 'bg-purple-900/30 text-purple-300'
                        }`}>
                          {isConstruction ? '🏗️ Construction' : '🔬 Research'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        isComplete ? 'text-green-400' : 'text-gold'
                      }`}>
                        {isComplete ? '✓ Complete!' : formatTime(timeRemaining)}
                      </div>
                      {!isComplete && (
                        <div className="text-xs text-gray-400">
                          {Math.round(progress)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                          isConstruction 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                            : 'bg-gradient-to-r from-purple-400 to-purple-600'
                        }`}
                        style={{ 
                          width: `${progress}%`,
                          boxShadow: `0 0 5px ${isConstruction ? 'rgba(255, 215, 0, 0.3)' : 'rgba(147, 51, 234, 0.3)'}`
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  {isComplete && !loading && (
                    <button
                      onClick={() => isConstruction 
                        ? handleConstructionComplete(itemId) 
                        : handleResearchComplete(itemId)
                      }
                      className={`w-full py-2 px-3 rounded text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isConstruction
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 hover:from-yellow-400 hover:to-yellow-500'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500'
                      }`}
                    >
                      <span className="flex items-center justify-center space-x-1">
                        <span>{isConstruction ? '🔨' : '🔬'}</span>
                        <span>Complete {isConstruction ? 'Construction' : 'Research'}</span>
                      </span>
                    </button>
                  )}

                  {loading && (
                    <div className={`w-full py-2 px-3 rounded text-xs font-medium text-center ${
                      isConstruction 
                        ? 'bg-yellow-900/30 text-yellow-300' 
                        : 'bg-purple-900/30 text-purple-300'
                    }`}>
                      <span className="flex items-center justify-center space-x-1">
                        <span className="animate-spin">⚙️</span>
                        <span>Completing...</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 