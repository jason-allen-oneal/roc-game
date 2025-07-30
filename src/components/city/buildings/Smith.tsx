interface SmithProps {
  level: number;
}

export default function Smith({ level }: SmithProps) {
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-orange-800 mb-2">Blacksmith</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Production Speed:</span>
            <span className="font-medium">+{level * 15}%</span>
          </div>
          <div className="flex justify-between">
            <span>Quality Bonus:</span>
            <span className="font-medium">+{level * 2}%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Crafting</h4>
        <ul className="text-xs space-y-1">
          <li>• Weapons and Armor</li>
          <li>• Tools and Equipment</li>
          <li>• Siege Equipment</li>
          <li>• Special Items</li>
        </ul>
      </div>
    </div>
  );
} 