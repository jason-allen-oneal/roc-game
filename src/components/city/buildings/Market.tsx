interface MarketProps {
  level: number;
}

export default function Market({ level }: MarketProps) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-green-800 mb-2">Trade Center</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Trade Slots:</span>
            <span className="font-medium">{level * 2}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Rate:</span>
            <span className="font-medium">{Math.max(5, 15 - level)}%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Features</h4>
        <ul className="text-xs space-y-1">
          <li>• Trade resources with other players</li>
          <li>• Generate gold through taxes</li>
          <li>• Access to rare materials</li>
          <li>• Economic bonuses</li>
        </ul>
      </div>
    </div>
  );
} 