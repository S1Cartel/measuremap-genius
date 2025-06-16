
import { useState } from 'react';
import Map from '../components/Map';
import MeasurementPanel from '../components/MeasurementPanel';
import MapControls from '../components/MapControls';
import MeasurementHistory from '../components/MeasurementHistory';
import MapGenerator from '../components/MapGenerator';
import { toast } from '@/hooks/use-toast';
import { generatePOIsForArea, fetchAreaBoundary, type POI } from '../components/POIService';

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
  const [showMapGenerator, setShowMapGenerator] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'circle' | 'line'>('polygon');
  const [shouldClear, setShouldClear] = useState(false);
  
  // Map generation state
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [generatedPOIs, setGeneratedPOIs] = useState<POI[]>([]);
  const [areaBoundary, setAreaBoundary] = useState<number[][]>([]);
  const [generatedAreaName, setGeneratedAreaName] = useState('');

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
    setGeneratedPOIs([]);
    setAreaBoundary([]);
    setGeneratedAreaName('');
    toast({
      title: "Cleared",
      description: "All measurements and generated maps have been removed",
    });
  };

  const handleDeleteMeasurement = (index: number) => {
    setMeasurements(prev => prev.filter((_, i) => i !== index));
    if (measurements[index] === measurement) {
      setMeasurement(null);
    }
  };

  const handleGenerateMap = async (areaName: string) => {
    setIsGeneratingMap(true);
    try {
      toast({
        title: "Generating Map",
        description: `Creating professional map for ${areaName}...`,
      });

      const boundary = await fetchAreaBoundary(areaName);
      const pois = await generatePOIsForArea(areaName, boundary);
      
      setAreaBoundary(boundary);
      setGeneratedPOIs(pois);
      setGeneratedAreaName(areaName);
      
      toast({
        title: "Map Generated",
        description: `Professional map created with ${pois.length} points of interest`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate map for the specified area",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMap(false);
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
          generatedPOIs={generatedPOIs}
          areaBoundary={areaBoundary}
          areaName={generatedAreaName}
        />
        <MapControls 
          isDrawing={isDrawing}
          onStartDrawing={() => setIsDrawing(true)}
          onCancelDrawing={() => setIsDrawing(false)}
          onClearAll={handleClearAll}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onToggleMapGenerator={() => setShowMapGenerator(!showMapGenerator)}
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
        {showMapGenerator && (
          <div className="absolute top-4 left-4 z-20">
            <MapGenerator
              onGenerateMap={handleGenerateMap}
              isGenerating={isGeneratingMap}
              generatedPOIs={generatedPOIs}
              boundaryCoordinates={areaBoundary}
              areaName={generatedAreaName}
            />
          </div>
        )}
      </div>
      <MeasurementPanel measurement={measurement} />
    </div>
  );
};

export default Index;
