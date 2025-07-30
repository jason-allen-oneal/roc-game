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
        <div className="bg-forest-gradient text-gold-light border-b border-gold">
            {/* Main Header */}
            <div className="px-4 py-3">
                <div className="flex justify-between items-start">
                    {/* Left Side - Navigation Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentView('city')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                currentView === 'city'
                                    ? 'bg-gold-gradient text-forest-dark font-semibold shadow-lg'
                                    : 'bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest'
                            }`}
                        >
                            City
                        </button>
                        <button
                            onClick={() => setCurrentView('field')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                currentView === 'field'
                                    ? 'bg-gold-gradient text-forest-dark font-semibold shadow-lg'
                                    : 'bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest'
                            }`}
                        >
                            Field
                        </button>
                        <button
                            onClick={() => setCurrentView('map')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                currentView === 'map'
                                    ? 'bg-gold-gradient text-forest-dark font-semibold shadow-lg'
                                    : 'bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest'
                            }`}
                        >
                            Kingdom
                        </button>
                    </div>

                    {/* Center - Logo and Action Buttons */}
                    <div className="flex flex-col items-center space-y-2">
                        <h1 className="text-2xl font-bold text-gold-light drop-shadow-lg">Realms of Camelot</h1>
                        <div className="flex space-x-2">
                        <button className="px-3 py-1 rounded text-sm font-medium bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest transition-colors">
                            Alliance
                        </button>
                        <button className="px-3 py-1 rounded text-sm font-medium bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest transition-colors">
                            Inventory
                        </button>
                        <button className="px-3 py-1 rounded text-sm font-medium bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest transition-colors">
                            Messages
                        </button>
                        <button className="px-3 py-1 rounded text-sm font-medium bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest transition-colors">
                            Shop
                        </button>
                    </div>
                        {/* Resource Icons and Counts */}
                        <div className="flex space-x-4 bg-earth-dark bg-opacity-80 px-4 py-2 rounded border border-gold">
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/food.png" 
                                    alt="Food" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-gold font-bold">{currentCity?.resources?.food?.toLocaleString() || '0'}</span>
                                <span className="text-gold-light text-xs">Food</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/wood.png" 
                                    alt="Wood" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-gold font-bold">{currentCity?.resources?.wood?.toLocaleString() || '0'}</span>
                                <span className="text-gold-light text-xs">Wood</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/stone.png" 
                                    alt="Stone" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-gold font-bold">{currentCity?.resources?.stone?.toLocaleString() || '0'}</span>
                                <span className="text-gold-light text-xs">Stone</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/gold.png" 
                                    alt="Gold" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-gold font-bold">{currentCity?.resources?.gold?.toLocaleString() || '0'}</span>
                                <span className="text-gold-light text-xs">Gold</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Image 
                                    src="/resources/ore.png" 
                                    alt="Ore" 
                                    width={16} 
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-gold font-bold">{currentCity?.resources?.ore?.toLocaleString() || '0'}</span>
                                <span className="text-gold-light text-xs">Ore</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Player Info */}
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="text-gold-light font-semibold">{player.name}</p>
                            <p className="text-gold-light text-sm">Level 1</p>
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold">
                            <Image 
                                src={player.avatar} 
                                alt={player.name} 
                                width={40} 
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}