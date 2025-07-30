import logger from './logger';

export interface MapTile {
  id: number;
  kingdomId: number;
  type: string;
  x: number;
  y: number;
  level: number;
  city?: {
    id: number;
    name: string;
    age: number;
    playerName: string;
  };
}

export interface MapCity {
  id: number;
  name: string;
  age: number;
  playerName: string;
  x: number;
  y: number;
}

export interface MapViewport {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MapData {
  tiles: MapTile[];
  cities: MapCity[];
  viewport: MapViewport;
}

export interface MapCallback {
  (data: MapData): void;
}

class MapManager {
  private static instance: MapManager;
  private tileCache: Map<string, MapTile> = new Map();
  private viewportCache: Map<string, MapData> = new Map();
  private callbacks: Map<string, MapCallback[]> = new Map();
  private loadingStates: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }

  // Generate tile key like Camelot's pattern: "bl_"+xcoord+"_bt_"+ycoord
  private generateTileKey(x: number, y: number): string {
    return `bl_${x}_bt_${y}`;
  }

  // Generate viewport key for caching
  private generateViewportKey(kingdomId: number, minX: number, maxX: number, minY: number, maxY: number): string {
    return `${kingdomId}_${minX}_${maxX}_${minY}_${maxY}`;
  }

  // Get map tiles using Camelot-style coordinate keys
  async getMapTilesAjax(kingdomId: number, centerX: number, centerY: number, viewportSize: number = 20): Promise<MapData> {
    const minX = centerX - Math.floor(viewportSize / 2);
    const maxX = centerX + Math.floor(viewportSize / 2);
    const minY = centerY - Math.floor(viewportSize / 2);
    const maxY = centerY + Math.floor(viewportSize / 2);
    
    const viewportKey = this.generateViewportKey(kingdomId, minX, maxX, minY, maxY);
    
    // Check cache first
    if (this.viewportCache.has(viewportKey)) {
      logger.debug('MapManager - returning cached viewport data', { viewportKey });
      return this.viewportCache.get(viewportKey)!;
    }

    // Check if already loading
    if (this.loadingStates.get(viewportKey)) {
      return new Promise((resolve) => {
        const callbacks = this.callbacks.get(viewportKey) || [];
        callbacks.push(resolve);
        this.callbacks.set(viewportKey, callbacks);
      });
    }

    // Set loading state
    this.loadingStates.set(viewportKey, true);

    try {
      logger.debug('MapManager - fetching map tiles', { 
        kingdomId, 
        centerX, 
        centerY, 
        viewportSize,
        viewportKey 
      });

      const params = new URLSearchParams({
        centerX: centerX.toString(),
        centerY: centerY.toString(),
        viewportSize: viewportSize.toString()
      });
      
      const response = await fetch(`/api/kingdom/${kingdomId}/tiles?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch map tiles: ${response.statusText}`);
      }

      const data: MapData = await response.json();
      
      // Cache the result
      this.viewportCache.set(viewportKey, data);
      
      // Cache individual tiles
      data.tiles.forEach(tile => {
        const tileKey = this.generateTileKey(tile.x, tile.y);
        this.tileCache.set(tileKey, tile);
      });

      // Resolve any pending callbacks
      const pendingCallbacks = this.callbacks.get(viewportKey) || [];
      pendingCallbacks.forEach(callback => callback(data));
      this.callbacks.delete(viewportKey);

      logger.debug('MapManager - map tiles fetched successfully', {
        tileCount: data.tiles.length,
        cityCount: data.cities.length,
        viewportKey
      });

      return data;
    } catch (error) {
      logger.error('MapManager - error fetching map tiles', { error: String(error), viewportKey });
      throw error;
    } finally {
      this.loadingStates.delete(viewportKey);
    }
  }

  // Get single tile by coordinates (Camelot-style)
  getTileByCoordinates(x: number, y: number): MapTile | null {
    const tileKey = this.generateTileKey(x, y);
    return this.tileCache.get(tileKey) || null;
  }

  // Clear cache for a specific kingdom
  clearKingdomCache(kingdomId: number): void {
    const keysToDelete: string[] = [];
    
    this.viewportCache.forEach((_, key) => {
      if (key.startsWith(`${kingdomId}_`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.viewportCache.delete(key);
      this.callbacks.delete(key);
      this.loadingStates.delete(key);
    });

    logger.debug('MapManager - cleared kingdom cache', { kingdomId });
  }

  // Clear all caches
  clearAllCaches(): void {
    this.tileCache.clear();
    this.viewportCache.clear();
    this.callbacks.clear();
    this.loadingStates.clear();
    
    logger.debug('MapManager - cleared all caches');
  }

  // Get cache statistics
  getCacheStats(): { tileCacheSize: number; viewportCacheSize: number } {
    return {
      tileCacheSize: this.tileCache.size,
      viewportCacheSize: this.viewportCache.size
    };
  }
}

// Export singleton instance
export const g_mapObject = MapManager.getInstance(); 