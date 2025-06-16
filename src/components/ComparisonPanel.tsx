
import { Card } from '@/components/ui/card';
import { TrendingUp, Home, Building, TreePine } from 'lucide-react';

interface ComparisonPanelProps {
  area: number; // in square meters
}

const ComparisonPanel = ({ area }: ComparisonPanelProps) => {
  const areaHectares = area / 10000;
  const areaAcres = areaHectares * 2.471;
  
  const comparisons = [
    {
      icon: <Home className="h-5 w-5 text-emerald-400" />,
      name: "Football Fields",
      value: (area / 5351).toFixed(1),
      color: "from-emerald-600 to-teal-600"
    },
    {
      icon: <Building className="h-5 w-5 text-violet-400" />,
      name: "City Blocks (NYC)",
      value: (areaHectares / 2.0).toFixed(2),
      color: "from-violet-600 to-purple-600"
    },
    {
      icon: <TreePine className="h-5 w-5 text-green-400" />,
      name: "Central Park (NYC)",
      value: (areaHectares / 341).toFixed(3),
      color: "from-green-600 to-emerald-600"
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300 mb-3">📏 Size Comparisons</h4>
      {comparisons.map((comp, index) => (
        <div 
          key={index}
          className={`bg-gradient-to-r ${comp.color}/20 p-3 rounded-xl border border-current/30`}
        >
          <div className="flex items-center gap-2 mb-1">
            {comp.icon}
            <span className="text-sm font-medium text-gray-300">{comp.name}</span>
          </div>
          <p className="text-lg font-bold text-white">{comp.value}</p>
        </div>
      ))}
    </div>
  );
};

export default ComparisonPanel;
