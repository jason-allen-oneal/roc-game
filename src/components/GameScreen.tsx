'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import GameHeader from './global/GameHeader';
import Realm from './realm/Realm';
import Field from './field/Field';
import City from './city/City';
import CitySelector from './city/CitySelector';
import Chat from './Chat';
import { redirect } from 'next/navigation';

type View = 'city' | 'field' | 'map';

export default function GameScreen() {
  const { player, loading, error } = usePlayer();
  const [currentView, setCurrentView] = useState<View>('city');

  const handleCitySelect = async (cityId: number) => {
    try {
      // Update the player's lastCity in the database
      const response = await fetch(`/api/player/${player?.id}/cities`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastCity: cityId }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch city');
      }

      // Refresh the page to load the new city data
      window.location.reload();
    } catch (error) {
      console.error('Error switching city:', error);
    }
  };

  // Listen for city view switch event from field
  useEffect(() => {
    const handleSwitchToCityView = () => {
      setCurrentView('city');
    };

    window.addEventListener('switchToCityView', handleSwitchToCityView);
    
    return () => {
      window.removeEventListener('switchToCityView', handleSwitchToCityView);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-gold-light">Loading your kingdom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-forest-gradient flex items-center justify-center">
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

  if (!player) {
    redirect('/create-player');
  }

  return (
    <div className="h-screen bg-forest-gradient flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col">
        {/* Navigation Bar */}
        <GameHeader currentView={currentView} setCurrentView={setCurrentView} />

        {/* Main Content Area - Responsive Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Game View Column - Takes most space on desktop */}
          <div className="flex-1 overflow-hidden min-w-0 relative">
            {currentView === 'city' && (
              <City/>
            )}

            {currentView === 'field' && (
              <Field/>
            )}

            {currentView === 'map' && (
              <Realm/>
            )}

            {/* City Selector - Only over game view areas */}
            <CitySelector onCitySelect={handleCitySelect} />
          </div>

          {/* Chat Column - Fixed width on desktop, full width on mobile */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <Chat className="w-full h-full" />
          </div>
          
          {/* Mobile Chat - Full width at bottom on mobile */}
          <div className="md:hidden w-full h-64 flex-shrink-0">
            <Chat className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
} 