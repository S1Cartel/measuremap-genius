
import { useState } from 'react';
import Map from '../components/Map';
import MeasurementPanel from '../components/MeasurementPanel';
import MapControls from '../components/MapControls';
import MeasurementHistory from '../components/MeasurementHistory';
import { toast } from '@/hooks/use-toast';

export interface Measurement {
  type: 'polygon' | 'circle' | 'line';
  area?: number;
  perimeter?: number;
  distance?: number;
  radius?: number;
  coordinates?: number[][];
  centerPoint?: [number, number];
  location?: string;
}

const Index = () => {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'circle' | 'line'>('polygon');
  const [shouldClear, setShouldClear] = useState(false);

  const handleMeasurementComplete = (data: Measurement) => {
    setMeasurement(data);
    setMeasurements(prev => [data, ...prev]);
    setIsDrawing(false);
    
    const message = data.type === 'polygon' ? `Area: ${(data.area! / 10000).toFixed(2)} hectares` :
                   data.type === 'circle' ? `Circle area: ${(data.area! / 10000).toFixed(2)} hectares` :
                   `Distance: ${(data.distance! / 1000).toFixed(2)} km`;
    
    toast({
      title: "Measurement Complete",
      description: message,
    });
  };

  const handleClearAll = () => {
    setShouldClear(true);
    setTimeout(() => setShouldClear(false), 100);
    setMeasurements([]);
    setMeasurement(null);
    toast({
      title: "Cleared",
      description: "All measurements have been removed",
    });
  };

  const handleDeleteMeasurement = (index: number) => {
    setMeasurements(prev => prev.filter((_, i) => i !== index));
    if (measurements[index] === measurement) {
      setMeasurement(null);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-violet-900">
      <div className="relative flex-1">
        <Map 
          isDrawing={isDrawing} 
          onMeasurementComplete={handleMeasurementComplete}
          drawingMode={drawingMode}
          onClearAll={() => {}}
          shouldClear={shouldClear}
        />
        <MapControls 
          isDrawing={isDrawing}
          onStartDrawing={() => setIsDrawing(true)}
          onCancelDrawing={() => setIsDrawing(false)}
          onClearAll={handleClearAll}
          onToggleHistory={() => setShowHistory(!showHistory)}
          drawingMode={drawingMode}
          onDrawingModeChange={setDrawingMode}
        />
        {showHistory && (
          <MeasurementHistory
            measurements={measurements}
            onSelectMeasurement={setMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
      <MeasurementPanel measurement={measurement} />
    </div>
  );
};

export default Index;
