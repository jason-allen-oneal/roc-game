import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Tile {
  id: number;
  kingdomId: number;
  type: 'PLAINS' | 'FORESTS' | 'HILLS' | 'MOUNTAINS' | 'LAKES' | 'MOORS' | 'RUINS';
  x: number;
  y: number;
  resources: Record<string, unknown>;
  strategic?: Record<string, unknown>;
  development?: Record<string, unknown>;
  city?: {
    id: number;
    name: string;
    player: {
      id: number;
      name: string;
    };
  };
}

interface Viewport {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  centerX: number;
  centerY: number;
  size: number;
}

interface MapTilesResponse {
  tiles: Tile[];
  viewport: Viewport;
  totalTiles: number;
}

interface UseMapTilesOptions {
  kingdomId: number;
  initialCenterX?: number;
  initialCenterY?: number;
  viewportSize?: number;
  debounceMs?: number;
}

export function useMapTiles({
  kingdomId,
  initialCenterX = 375, // Center of 750x750 map
  initialCenterY = 375,
  viewportSize = 50,
  debounceMs = 300
}: UseMapTilesOptions) {
  const { data: session } = useSession();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [viewport, setViewport] = useState<Viewport>({
    startX: initialCenterX - Math.floor(viewportSize / 2),
    endX: initialCenterX + Math.floor(viewportSize / 2),
    startY: initialCenterY - Math.floor(viewportSize / 2),
    endY: initialCenterY + Math.floor(viewportSize / 2),
    centerX: initialCenterX,
    centerY: initialCenterY,
    size: viewportSize
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchTiles = useCallback(async (centerX: number, centerY: number, size: number) => {
    if (!session?.user?.id) return;

    const now = Date.now();
    if (now - lastFetchTime < debounceMs) return;

    setLoading(true);
    setError(null);
    setLastFetchTime(now);

    try {
      const params = new URLSearchParams({
        centerX: centerX.toString(),
        centerY: centerY.toString(),
        viewportSize: size.toString()
      });

      const response = await fetch(`/api/kingdom/${kingdomId}/tiles?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tiles: ${response.statusText}`);
      }

      const data: MapTilesResponse = await response.json();
      setTiles(data.tiles);
      setViewport(data.viewport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tiles');
    } finally {
      setLoading(false);
    }
  }, [kingdomId, session?.user?.id, debounceMs, lastFetchTime]);

  const moveViewport = useCallback((newCenterX: number, newCenterY: number) => {
    const clampedX = Math.max(viewportSize / 2, Math.min(750 - viewportSize / 2, newCenterX));
    const clampedY = Math.max(viewportSize / 2, Math.min(750 - viewportSize / 2, newCenterY));
    
    fetchTiles(clampedX, clampedY, viewportSize);
  }, [fetchTiles, viewportSize]);

  const zoomViewport = useCallback((newSize: number) => {
    const clampedSize = Math.max(10, Math.min(100, newSize));
    fetchTiles(viewport.centerX, viewport.centerY, clampedSize);
  }, [fetchTiles, viewport.centerX, viewport.centerY]);

  // Initial load
  useEffect(() => {
    if (session?.user?.id) {
      fetchTiles(initialCenterX, initialCenterY, viewportSize);
    }
  }, [session?.user?.id, kingdomId, initialCenterX, initialCenterY, viewportSize, fetchTiles]);

  return {
    tiles,
    viewport,
    loading,
    error,
    moveViewport,
    zoomViewport,
    refetch: () => fetchTiles(viewport.centerX, viewport.centerY, viewport.size)
  };
} 