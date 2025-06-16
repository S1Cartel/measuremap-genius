
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Info } from 'lucide-react';
import type { POI } from './POIService';

interface InteractiveMapLegendProps {
  pois: POI[];
  onToggleCategory: (category: string, visible: boolean) => void;
  visibleCategories: Set<string>;
}

const InteractiveMapLegend = ({ pois, onToggleCategory, visibleCategories }: InteractiveMapLegendProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const categoryStats = pois.reduce((acc, poi) => {
    acc[poi.category] = (acc[poi.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryStats).map(([category, count]) => {
    const samplePOI = pois.find(p => p.category === category);
    return {
      name: category,
      count,
      color: samplePOI?.color || '#6b7280',
      icon: samplePOI?.icon
    };
  });

  return (
    <Card className="absolute top-20 right-4 bg-black/90 border-violet-500/30 p-4 max-w-xs z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-violet-400" />
          <h4 className="text-sm font-medium text-white">Map Legend</h4>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white p-1 h-auto"
        >
          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <div className="text-white" style={{ color: category.color }}>
                  {category.icon}
                </div>
                <span className="text-sm text-gray-300 capitalize">
                  {category.name}s ({category.count})
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleCategory(category.name, !visibleCategories.has(category.name))}
                className="text-gray-400 hover:text-white p-1 h-auto"
              >
                {visibleCategories.has(category.name) ? 
                  <Eye className="h-3 w-3" /> : 
                  <EyeOff className="h-3 w-3" />
                }
              </Button>
            </div>
          ))}
          
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              Scale: 1:25,000
            </div>
            <div className="text-xs text-gray-400">
              Total POIs: {pois.length}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InteractiveMapLegend;
