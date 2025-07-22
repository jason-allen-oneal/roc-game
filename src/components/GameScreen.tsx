'use client';

import { useState } from 'react';

type View = 'city' | 'field' | 'map';

interface Player {
  id: string;
  name: string;
  gender: string;
  avatar: string;
  kingdomId: string;
  createdAt: Date;
}

interface GameScreenProps {
  player: Player;
}

export default function GameScreen({ player }: GameScreenProps) {
  const [currentView, setCurrentView] = useState<View>('city');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">
                  {player.name}'s Kingdom
                </span>
              </div>
            </div>
            
            {/* View Navigation */}
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('city')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'city'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                City
              </button>
              <button
                onClick={() => setCurrentView('field')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'field'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Field
              </button>
              <button
                onClick={() => setCurrentView('map')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'map'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Kingdom Map
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentView === 'city' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Your City</h2>
            {/* City view content will go here */}
            <p className="text-gray-600">City view coming soon...</p>
          </div>
        )}

        {currentView === 'field' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Field View</h2>
            {/* Field view content will go here */}
            <p className="text-gray-600">Field view coming soon...</p>
          </div>
        )}

        {currentView === 'map' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Kingdom Map</h2>
            {/* Map view content will go here */}
            <p className="text-gray-600">Map view coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
} 