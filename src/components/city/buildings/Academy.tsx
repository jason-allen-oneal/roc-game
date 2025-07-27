interface AcademyProps {
  level: number;
}

export default function Academy({ level }: AcademyProps) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-800 mb-2">Research Center</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Research Slots:</span>
            <span className="font-medium">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Research Speed:</span>
            <span className="font-medium">+{level * 10}%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Research Areas</h4>
        <ul className="text-sm space-y-1">
          <li>• Military Technology</li>
          <li>• Economic Development</li>
          <li>• Infrastructure</li>
          <li>• Cultural Advancement</li>
        </ul>
      </div>
    </div>
  );
} 