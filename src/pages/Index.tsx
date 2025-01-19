import { useState } from 'react';
import Map from '../components/Map';
import MeasurementPanel from '../components/MeasurementPanel';
import MapControls from '../components/MapControls';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export interface Measurement {
  area: number;
  perimeter: number;
  coordinates: number[][];
}

const Index = () => {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMeasurementComplete = (data: Measurement) => {
    setMeasurement(data);
    setIsDrawing(false);
    toast({
      title: "Measurement Complete",
      description: `Area: ${data.area.toFixed(2)} sq meters`,
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="relative flex-1">
        <Map 
          isDrawing={isDrawing} 
          onMeasurementComplete={handleMeasurementComplete} 
        />
        <MapControls 
          isDrawing={isDrawing}
          onStartDrawing={() => setIsDrawing(true)}
          onCancelDrawing={() => setIsDrawing(false)}
        />
      </div>
      <MeasurementPanel measurement={measurement} />
    </div>
  );
};

export default Index;