interface BarracksProps {
  level: number;
}

export default function Barracks({ level }: BarracksProps) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 p-4 rounded-lg">
        <h4 className="font-semibold text-red-800 mb-2">Military Training</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Training Capacity:</span>
            <span className="font-medium">{level * 10}</span>
          </div>
          <div className="flex justify-between">
            <span>Training Speed:</span>
            <span className="font-medium">+{level * 5}%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Available Units</h4>
        <ul className="text-sm space-y-1">
          <li>• Infantry (Level 1+)</li>
          <li>• Archers (Level 3+)</li>
          <li>• Cavalry (Level 5+)</li>
          <li>• Siege Weapons (Level 7+)</li>
        </ul>
      </div>
    </div>
  );
} 