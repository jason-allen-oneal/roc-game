interface GenericBuildingProps {
  name: string;
  level: number;
  description: string;
}

export default function GenericBuilding({ name, level, description }: GenericBuildingProps) {
  return (
    <div className="space-y-4">
      <div className="bg-forest p-4 rounded-lg border border-gold">
        <h4 className="font-semibold text-gold-light mb-2">{name} Overview</h4>
        <div className="space-y-2 text-sm text-gold-light">
          <div className="flex justify-between">
            <span>Current Level:</span>
            <span className="font-medium text-gold">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>Building Type:</span>
            <span className="font-medium text-gold">{name}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-forest-light p-4 rounded-lg border border-gold">
        <h4 className="font-semibold text-gold-light mb-2">Description</h4>
        <p className="text-sm text-gold-light">{description}</p>
      </div>
    </div>
  );
} 