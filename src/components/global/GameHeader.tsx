import { usePlayer } from '@/contexts/PlayerContext';
import { useCity } from '@/contexts/CityContext';
import Image from 'next/image';

interface GameHeaderProps {
  currentView: string;
  setCurrentView: (view: 'city' | 'field' | 'map') => void;
}

export default function GameHeader({ currentView, setCurrentView }: GameHeaderProps) {
    const { player } = usePlayer();
    const { currentCity } = useCity();

    if (!player) {
        return <div>Loading...</div>;
    }

    return (
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            {/* Main Header */}
            <div className="px-4 py-3">
                <div className="flex justify-between items-start">
                    {/* Left Side - Navigation Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentView('city')}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                currentView === 'city'
                                    ? 'bg-yellow-500 text-blue-900'
                                    : 'bg-blue-700 text-white hover:bg-blue-600'
                            }`}
                        >
                            City
                        </button>
                        <button
                            onClick={() => setCurrentView('field')}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                currentView === 'field'
                                    ? 'bg-yellow-500 text-blue-900'
                                    : 'bg-blue-700 text-white hover:bg-blue-600'
                            }`}
                        >
                            Field
                        </button>
                        <button
                            onClick={() => setCurrentView('map')}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                currentView === 'map'
                                    ? 'bg-yellow-500 text-blue-900'
                                    : 'bg-blue-700 text-white hover:bg-blue-600'
                            }`}
                        >
                            Kingdom
                        </button>
                    </div>

                    {/* Center - Logo and Action Buttons */}
                    <div className="flex flex-col items-center space-y-2">
                        <h1 className="text-2xl font-bold text-yellow-400">Realms of Camelot</h1>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600">
                                Alliance
                            </button>
                            <button className="px-3 py-1 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600">
                                Inventory
                            </button>
                            <button className="px-3 py-1 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600">
                                Messages
                            </button>
                            <button className="px-3 py-1 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600">
                                Shop
                            </button>
                        </div>
                        {/* Resource Icons and Counts */}
                        <div className="flex space-x-4 bg-black bg-opacity-30 px-4 py-2 rounded">
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/food.png" 
                                    alt="Food" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-white font-bold">{currentCity?.resources?.food?.toLocaleString() || '0'}</span>
                                <span className="text-gray-300 text-xs">Food</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/wood.png" 
                                    alt="Wood" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-white font-bold">{currentCity?.resources?.wood?.toLocaleString() || '0'}</span>
                                <span className="text-gray-300 text-xs">Wood</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/stone.png" 
                                    alt="Stone" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-white font-bold">{currentCity?.resources?.stone?.toLocaleString() || '0'}</span>
                                <span className="text-gray-300 text-xs">Stone</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/ore.png" 
                                    alt="Ore" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-white font-bold">{currentCity?.resources?.ore?.toLocaleString() || '0'}</span>
                                <span className="text-gray-300 text-xs">Ore</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/gold.png" 
                                    alt="Gold" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-white font-bold">{currentCity?.resources?.gold?.toLocaleString() || '0'}</span>
                                <span className="text-gray-300 text-xs">Gold</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Player Avatar */}
                    <div className="flex items-center space-x-3 bg-black bg-opacity-30 px-4 py-2 rounded">
                        <div className="text-right">
                            <div className="font-bold">{player.name}</div>
                            <div className="text-sm text-gray-300">Level 1</div>
                        </div>
                        <div className="w-16 h-16 bg-gray-600 rounded-full overflow-hidden flex items-center justify-center">
                            <Image 
                                src={player.avatar} 
                                alt={player.name} 
                                width={64} 
                                height={64}
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}