import React from 'react';

interface TowerProps {
  level: number;
  cityId: number;
  onClose: () => void;
}

const Tower: React.FC<TowerProps> = ({ level, onClose }) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-200">Tower</h3>
        <p className="text-sm text-gray-400 mt-2">
          The Tower is used to send early warnings of invasions. The higher its level, the more detailed information you gain.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Level</span>
          <span className="text-sm font-medium text-gray-200">{level}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Warning Range</span>
          <span className="text-sm font-medium text-gray-200">{level * 2} tiles</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Detection Detail</span>
          <span className="text-sm font-medium text-gray-200">
            {level === 1 ? 'Basic' : level === 2 ? 'Enhanced' : level === 3 ? 'Advanced' : 'Master'}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Tower; 