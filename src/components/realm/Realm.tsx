'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useKingdomMap } from '@/hooks/useKingdomMap';
import { useCity } from '@/contexts/CityContext';
import logger from '@/lib/logger';

const Realm = React.memo(function Realm() {
  const { mapData, loading, error } = useKingdomMap();
  const { currentCity } = useCity();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use fixed tile size
  const tileSize = 60;

  // Center map on player's city when data loads
  React.useEffect(() => {
    if (mapData && mapData.cities.length > 0) {
      // Find the player's city by matching with current city
      const playerCity = mapData.cities.find(city => city.id === currentCity?.id);
      
      if (!playerCity) {
        logger.warn('Realm - player city not found in viewport', {
          currentCityId: currentCity?.id,
          availableCityIds: JSON.stringify(mapData.cities.map(c => c.id)),
          viewport: JSON.stringify(mapData.viewport)
        });
        return; // Don't center if player's city is not in viewport
      }
      
      logger.debug('Realm - centering on player city', {
        cityCount: mapData.cities.length,
        allCities: mapData.cities.map(city => ({
          id: city.id,
          name: city.name,
          x: city.x,
          y: city.y,
          age: city.age
        })),
        playerCity: {
          id: playerCity.id,
          name: playerCity.name,
          x: playerCity.x,
          y: playerCity.y,
          age: playerCity.age
        },
        viewport: {
          minX: mapData.viewport.minX,
          maxX: mapData.viewport.maxX,
          minY: mapData.viewport.minY,
          maxY: mapData.viewport.maxY
        },
        currentCityId: currentCity?.id
      });
      
      // Calculate center position
      const containerWidth = 840;
      const containerHeight = 476;
      const mapWidth = (mapData.viewport.maxX - mapData.viewport.minX + 1) * tileSize;
      const mapHeight = (mapData.viewport.maxY - mapData.viewport.minY + 1) * tileSize;
      
      // Calculate the city's position within the tile grid
      const cityTileX = playerCity.x - mapData.viewport.minX;
      const cityTileY = playerCity.y - mapData.viewport.minY;
      
      // Calculate the city's pixel position within the map
      const cityPixelX = cityTileX * tileSize;
      const cityPixelY = cityTileY * tileSize;
      
      // Calculate offset to center the city in the viewport
      const centerX = containerWidth / 2 - cityPixelX;
      const centerY = containerHeight / 2 - cityPixelY;
      
      // Apply bounds to keep map within viewport
      const maxOffsetX = Math.max(0, mapWidth - containerWidth);
      const maxOffsetY = Math.max(0, mapHeight - containerHeight);
      
      const finalOffset = {
        x: Math.max(-maxOffsetX, Math.min(0, centerX)),
        y: Math.max(-maxOffsetY, Math.min(0, centerY))
      };
      
      logger.debug('Realm - calculated offset', {
        cityTileX,
        cityTileY,
        cityPixelX,
        cityPixelY,
        centerX,
        centerY,
        maxOffsetX,
        maxOffsetY,
        finalOffset,
        mapWidth,
        mapHeight,
        containerWidth,
        containerHeight
      });
      
      setOffset(finalOffset);
    } else {
      logger.debug('Realm - no map data or cities available', {
        hasMapData: !!mapData,
        cityCount: mapData?.cities?.length || 0
      });
    }
  }, [mapData, tileSize, currentCity?.id]);

  // Map tile types to image names
  const getTileImage = (tileType: string): string => {
    switch (tileType.toUpperCase()) {
      case 'FORESTS':
        return 'wood.png';
      case 'HILLS':
        return 'stone.png';
      case 'RUINS':
        return 'ruin.png';
      case 'PLAINS':
        return 'plain.png';
      case 'MOUNTAINS':
        return 'ore.png';
      case 'FOOD':
        return 'food.png';
      case 'BARBARIAN':
        return 'barb.png';
      default:
        return 'plain.png'; // Default fallback
    }
  };

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  }, [offset]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !mapData) return;
    e.preventDefault();
    
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };

    // Calculate bounds to keep map within viewport
    const containerWidth = 840;
    const containerHeight = 476;
    const mapWidth = (mapData.viewport.maxX - mapData.viewport.minX + 1) * tileSize;
    const mapHeight = (mapData.viewport.maxY - mapData.viewport.minY + 1) * tileSize;
    
    const maxOffsetX = Math.max(0, mapWidth - containerWidth);
    const maxOffsetY = Math.max(0, mapHeight - containerHeight);
    
    setOffset({
      x: Math.max(-maxOffsetX, Math.min(0, newOffset.x)),
      y: Math.max(-maxOffsetY, Math.min(0, newOffset.y))
    });
  }, [isDragging, dragStart, mapData, offset]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse leave to stop dragging
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for smoother dragging
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !mapData) return;
      
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };

      const containerWidth = 840;
      const containerHeight = 476;
      const mapWidth = (mapData.viewport.maxX - mapData.viewport.minX + 1) * tileSize;
      const mapHeight = (mapData.viewport.maxY - mapData.viewport.minY + 1) * tileSize;
      
      const maxOffsetX = Math.max(0, mapWidth - containerWidth);
      const maxOffsetY = Math.max(0, mapHeight - containerHeight);
      
      setOffset({
        x: Math.max(-maxOffsetX, Math.min(0, newOffset.x)),
        y: Math.max(-maxOffsetY, Math.min(0, newOffset.y))
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, mapData, tileSize]);

  logger.debug('Realm - rendering kingdom map', { 
    loading, 
    hasData: !!mapData,
    tileCount: mapData?.tiles.length,
    cityCount: mapData?.cities.length,
    offset
  });

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-forest-gradient">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-gold-light">Loading kingdom map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-forest-gradient">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gold-gradient text-forest-dark rounded hover:opacity-90 transition-opacity font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-forest-gradient">
        <div className="text-center">
          <p className="text-gold-light">No kingdom data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-forest-gradient">
      <div 
        ref={containerRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ width: '840px', height: '476px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Kingdom Background */}
        <Image
          src="/kingdom/base.png"
          alt="Kingdom Map"
          width={840}
          height={476}
          className="w-full h-full object-cover rounded-lg"
          priority
        />
        
        {/* Draggable Kingdom Tiles Layer */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            width: `${(mapData.viewport.maxX - mapData.viewport.minX + 1) * tileSize}px`,
            height: `${(mapData.viewport.maxY - mapData.viewport.minY + 1) * tileSize}px`
          }}
        >
          {/* Kingdom Tiles */}
          {mapData.tiles.map((tile) => {
            const x = (tile.x - mapData.viewport.minX) * tileSize;
            const y = (tile.y - mapData.viewport.minY) * tileSize;
            
            return (
              <div
                key={tile.id}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`
                }}
              >
                <Image
                  src={`/kingdom/${getTileImage(tile.type)}`}
                  alt={`${tile.type} tile`}
                  width={tileSize}
                  height={tileSize}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}

          {/* City Markers */}
          {mapData.cities.map((city) => {
            const x = (city.x - mapData.viewport.minX) * tileSize;
            const y = (city.y - mapData.viewport.minY) * tileSize;
            
            // Determine city image based on age
            const cityImage = city.age >= 3 ? 'city-large.png' : 'city-small.png';
            
            return (
              <div
                key={city.id}
                className="absolute cursor-pointer hover:scale-110 transition-transform"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`
                }}
                title={`${city.name} (Age ${city.age}) - ${city.playerName}`}
              >
                <Image
                  src={`/kingdom/${cityImage}`}
                  alt={`${city.name} city`}
                  width={tileSize}
                  height={tileSize}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Realm;