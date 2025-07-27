'use client';

import { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import GameHeader from './global/GameHeader';
import Realm from './realm/Realm';
import Field from './field/Field';
import City from './city/City';
import Chat from './Chat';
import { redirect } from 'next/navigation';

type View = 'city' | 'field' | 'map';

export default function GameScreen() {
  const { player, loading, error } = usePlayer();
  const [currentView, setCurrentView] = useState<View>('city');

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

        {/* Main Content Area - 2 Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Game View Column */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'city' && (
              <City/>
            )}

            {currentView === 'field' && (
              <Field/>
            )}

            {currentView === 'map' && (
              <Realm/>
            )}
          </div>

          {/* Chat Column */}
          <Chat className="w-96" />
        </div>
      </div>
    </div>
  );
} 