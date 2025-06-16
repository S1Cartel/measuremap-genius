
import { Button } from '@/components/ui/button';
import { MapPin, X, Zap, History, Trash2, Square, Circle, Route, Map } from 'lucide-react';
import { useState } from 'react';

interface MapControlsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearAll: () => void;
  onToggleHistory: () => void;
  onToggleMapGenerator: () => void;
  drawingMode: 'polygon' | 'circle' | 'line';
  onDrawingModeChange: (mode: 'polygon' | 'circle' | 'line') => void;
}

const MapControls = ({ 
  isDrawing, 
  onStartDrawing, 
  onCancelDrawing, 
  onClearAll,
  onToggleHistory,
  onToggleMapGenerator,
  drawingMode,
  onDrawingModeChange
}: MapControlsProps) => {
  const [showModeSelector, setShowModeSelector] = useState(false);

  const handleStartDrawing = () => {
    if (!isDrawing) {
      setShowModeSelector(true);
    } else {
      onStartDrawing();
    }
  };

  const handleModeSelect = (mode: 'polygon' | 'circle' | 'line') => {
    onDrawingModeChange(mode);
    setShowModeSelector(false);
    onStartDrawing();
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
      {showModeSelector && (
        <div className="flex gap-2 p-3 bg-black/90 backdrop-blur-md rounded-2xl border border-violet-500/30 shadow-2xl">
          <Button 
            onClick={() => handleModeSelect('polygon')} 
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border border-violet-400/50 rounded-xl"
            size="sm"
          >
            <Square className="mr-2 h-4 w-4" />
            Area
          </Button>
          <Button 
            onClick={() => handleModeSelect('circle')} 
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-400/50 rounded-xl"
            size="sm"
          >
            <Circle className="mr-2 h-4 w-4" />
            Circle
          </Button>
          <Button 
            onClick={() => handleModeSelect('line')} 
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border border-amber-400/50 rounded-xl"
            size="sm"
          >
            <Route className="mr-2 h-4 w-4" />
            Distance
          </Button>
        </div>
      )}
      
      <div className="flex gap-3 p-3 bg-black/90 backdrop-blur-md rounded-2xl border border-violet-500/30 shadow-2xl">
        {!isDrawing ? (
          <>
            <Button 
              onClick={handleStartDrawing} 
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border border-violet-400/50 rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-105"
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Measuring
            </Button>
            <Button 
              onClick={onToggleMapGenerator}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border border-cyan-500/50 rounded-xl"
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button 
              onClick={onToggleHistory}
              className="bg-gradient-to-r from-slate-700 to-gray-700 hover:from-slate-800 hover:to-gray-800 text-white border border-slate-500/50 rounded-xl"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button 
              onClick={onClearAll}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border border-red-500/50 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button 
            onClick={onCancelDrawing} 
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border border-red-500/50 rounded-xl shadow-lg shadow-red-500/25"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel {drawingMode}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapControls;
