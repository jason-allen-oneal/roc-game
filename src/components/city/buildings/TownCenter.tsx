interface TownCenterProps {
  level: number;
  cityAge: number;
}

export default function TownCenter({ level, cityAge }: TownCenterProps) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Town Center Overview</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>City Age:</span>
            <span className="font-medium">{cityAge}</span>
          </div>
          <div className="flex justify-between">
            <span>Population Capacity:</span>
            <span className="font-medium">{level * 100}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Benefits</h4>
        <ul className="text-xs space-y-1">
          <li>• Provides population capacity for your city</li>
          <li>• Higher levels unlock more building types</li>
          <li>• Required for city advancement</li>
        </ul>
      </div>
    </div>
  );
} 