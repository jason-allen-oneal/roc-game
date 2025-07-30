import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useCity } from '@/contexts/CityContext';
import { g_mapObject, MapData } from '@/lib/MapManager';
import logger from '@/lib/logger';

export function useKingdomMap() {
  const { player } = usePlayer();
  const { currentCity } = useCity();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKingdomMap = useCallback(async () => {
    if (!player?.kingdomId) {
      setError('No kingdom ID available');
      setLoading(false);
      return;
    }

    // Get player's city coordinates
    let centerX = 375; // Default to center of 750x750 map
    let centerY = 375;
    
    if (currentCity?.mapTile) {
      // Use actual mapTile coordinates
      centerX = currentCity.mapTile.x;
      centerY = currentCity.mapTile.y;
      
      logger.debug('useKingdomMap - using player city coordinates', {
        mapTileId: currentCity.mapTileId,
        mapTileX: currentCity.mapTile.x,
        mapTileY: currentCity.mapTile.y,
        centerX,
        centerY,
        cityName: currentCity.name
      });
    } else if (currentCity?.mapTileId) {
      // Fallback to extracting coordinates from mapTileId
      centerX = currentCity.mapTileId % 1000;
      centerY = Math.floor(currentCity.mapTileId / 1000);
      
      logger.debug('useKingdomMap - using fallback coordinates from mapTileId', {
        mapTileId: currentCity.mapTileId,
        centerX,
        centerY,
        cityName: currentCity.name
      });
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug('useKingdomMap - fetching kingdom data', {
        kingdomId: player.kingdomId,
        playerId: player.id,
        centerX,
        centerY
      });

      // Use Camelot-style map manager with player's city coordinates
      const data = await g_mapObject.getMapTilesAjax(
        player.kingdomId,
        centerX,
        centerY,
        20 // Viewport size
      );

      setMapData(data);

      logger.debug('useKingdomMap - kingdom data fetched successfully', {
        tileCount: data.tiles.length,
        cityCount: data.cities.length,
        viewport: JSON.stringify(data.viewport)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch kingdom data';
      setError(errorMessage);
      logger.error('useKingdomMap - error fetching kingdom data', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [player?.kingdomId, currentCity?.mapTileId, currentCity?.mapTile, currentCity?.name, player?.id]);

  useEffect(() => {
    fetchKingdomMap();
  }, [fetchKingdomMap]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      if (player?.kingdomId) {
        g_mapObject.clearKingdomCache(player.kingdomId);
      }
    };
  }, [player?.kingdomId]);

  return {
    mapData,
    loading,
    error,
    refetch: fetchKingdomMap,
    mapManager: g_mapObject
  };
} 