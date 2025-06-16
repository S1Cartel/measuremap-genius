
import { Button } from '@/components/ui/button';
import { MapPin, X, Zap } from 'lucide-react';

interface MapControlsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
}

const MapControls = ({ isDrawing, onStartDrawing, onCancelDrawing }: MapControlsProps) => {
  return (
    <div className="absolute bottom-6 left-6 flex gap-3">
      {!isDrawing ? (
        <Button 
          onClick={onStartDrawing} 
          className="shadow-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white backdrop-blur-sm border border-blue-500/50"
        >
          <Zap className="mr-2 h-4 w-4" />
          Start Measuring
        </Button>
      ) : (
        <Button 
          variant="destructive" 
          onClick={onCancelDrawing} 
          className="shadow-2xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 backdrop-blur-sm border border-red-500/50"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
};

export default MapControls;
