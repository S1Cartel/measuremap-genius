
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, X } from 'lucide-react';
import type { Measurement } from '../pages/Index';

interface MeasurementHistoryProps {
  measurements: Measurement[];
  onSelectMeasurement: (measurement: Measurement) => void;
  onDeleteMeasurement: (index: number) => void;
  onClose: () => void;
}

const MeasurementHistory = ({ 
  measurements, 
  onSelectMeasurement, 
  onDeleteMeasurement,
  onClose 
}: MeasurementHistoryProps) => {
  if (measurements.length === 0) {
    return (
      <div className="absolute top-6 right-6 w-80 bg-black/90 backdrop-blur-md text-white p-6 rounded-2xl border border-violet-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Measurement History
          </h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-400 text-center">No measurements yet</p>
      </div>
    );
  }

  return (
    <div className="absolute top-6 right-6 w-80 bg-black/90 backdrop-blur-md text-white p-6 rounded-2xl border border-violet-500/30 shadow-2xl max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
          Measurement History
        </h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {measurements.map((measurement, index) => (
          <div 
            key={index}
            className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 p-3 rounded-xl border border-violet-700/50 cursor-pointer hover:border-violet-500/70 transition-all"
            onClick={() => onSelectMeasurement(measurement)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3 w-3 text-violet-400" />
                  <span className="text-xs text-gray-400">
                    {measurement.location || 'Unknown location'}
                  </span>
                </div>
                <p className="text-sm text-violet-300 font-medium">
                  {measurement.type === 'polygon' && `${(measurement.area! / 10000).toFixed(2)} ha`}
                  {measurement.type === 'circle' && `${(measurement.area! / 10000).toFixed(2)} ha`}
                  {measurement.type === 'line' && `${(measurement.distance! / 1000).toFixed(2)} km`}
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMeasurement(index);
                }}
                variant="ghost" 
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeasurementHistory;
