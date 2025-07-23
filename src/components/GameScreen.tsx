'use client';

import { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

type View = 'city' | 'field' | 'map';

export default function GameScreen() {
  const { player, loading, error } = usePlayer();
  const [currentView, setCurrentView] = useState<View>('city');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your kingdom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No player data found</p>
          <a 
            href="/create-player"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create Player
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">
                  {player.name}&apos;s Kingdom
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