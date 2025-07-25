'use client';

import { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import GameHeader from './global/GameHeader';
import Realm from './realm/Realm';
import Field from './field/Field';
import City from './city/City';
import { redirect } from 'next/navigation';

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
    redirect('/create-player');
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
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
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-blue-600">System:</span> Welcome to Realms of Camelot!
                </p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-green-600">Player123:</span> Anyone want to trade resources?
                </p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-purple-600">LordKnight:</span> I need wood for my castle expansion
                </p>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 