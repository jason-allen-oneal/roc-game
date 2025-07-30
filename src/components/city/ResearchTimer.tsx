'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

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

interface ResearchTimerProps {
  cityId: number;
  onResearchComplete?: () => void;
}

export default function ResearchTimer({ cityId, onResearchComplete }: ResearchTimerProps) {
  const [researchingItems, setResearchingItems] = useState<PlayerResearch[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch researching items
  useEffect(() => {
    const fetchResearchingItems = async () => {
      try {
        const response = await fetch(`/api/city/${cityId}/research/active`);
        if (response.ok) {
          const data = await response.json();
          setResearchingItems(data);
        }
      } catch (error) {
        logger.error('ResearchTimer - error fetching researching items', { error: String(error) });
      }
    };

    fetchResearchingItems();
    
    // Poll every second for updates
    const interval = setInterval(fetchResearchingItems, 1000);
    
    return () => clearInterval(interval);
  }, [cityId]);

  const handleResearchComplete = async (researchId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/city/${cityId}/research/${researchId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        logger.debug('ResearchTimer - research completed successfully', { researchId });
        onResearchComplete?.();
        
        // Remove the completed research from the list
        setResearchingItems(prev => prev.filter(item => item.researchId !== researchId));
      } else {
        const error = await response.json();
        logger.error('ResearchTimer - error completing research', { researchId, error });
      }
    } catch (error) {
      logger.error('ResearchTimer - error completing research', { researchId, error: String(error) });
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

  if (researchingItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {researchingItems.map((item) => {
        const timeRemaining = getTimeRemaining(item.researchEndsAt);
        const progress = getProgress(item.researchEndsAt, item.researchStartedAt);
        const isComplete = timeRemaining <= 0;

        return (
          <div
            key={item.id}
            className="bg-forest-dark border border-gold rounded-lg p-4 shadow-lg max-w-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gold font-semibold text-sm">
                {item.research.name}
              </h4>
              <span className="text-gold-light text-xs">
                {isComplete ? 'Complete!' : formatTime(timeRemaining)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-forest rounded-full h-2 mb-3">
              <div
                className="bg-gold-gradient h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Action Button */}
            {isComplete && !loading && (
              <button
                onClick={() => handleResearchComplete(item.researchId)}
                className="w-full bg-gold-gradient text-forest-dark py-2 px-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Complete Research
              </button>
            )}

            {loading && (
              <div className="w-full bg-forest text-gold-light py-2 px-3 rounded text-sm text-center">
                Completing...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 