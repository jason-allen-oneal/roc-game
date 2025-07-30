'use client';

import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useCity } from '@/contexts/CityContext';
import logger from '@/lib/logger';

interface CitySelectorProps {
  onCitySelect: (cityId: number) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ onCitySelect }) => {
  const { player } = usePlayer();
  const { currentCity } = useCity();

  if (!player?.cities || player.cities.length === 0) {
    return null;
  }

  const handleCityClick = (cityId: number) => {
    logger.debug('CitySelector - city clicked', { cityId, currentCityId: currentCity?.id });
    if (cityId !== currentCity?.id) {
      onCitySelect(cityId);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 bg-black/80 border border-gold rounded-lg p-2">
      <div className="flex items-center space-x-2">
        {player.cities.map((city) => (
          <button
            key={city.id}
            onClick={() => handleCityClick(city.id)}
            className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
              city.id === currentCity?.id
                ? 'border-gold bg-gold/20 shadow-lg shadow-gold/50'
                : 'border-gold/50 bg-black/50 hover:border-gold hover:bg-gold/10'
            }`}
            title={`${city.name} (Age ${city.age})`}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-gold text-xs font-bold leading-none">
                {city.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-gold/70 text-xs leading-none mt-0.5">
                {city.age}
              </div>
            </div>
            {city.id === currentCity?.id && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full border border-black"></div>
            )}
          </button>
        ))}
        
        {/* Show empty slots for remaining cities (up to 5 total) */}
        {Array.from({ length: Math.max(0, 5 - player.cities.length) }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-600 bg-black/30 flex items-center justify-center"
            title="Empty Slot (Locked)"
          >
            <div className="text-gray-500 text-xs">?</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitySelector; 