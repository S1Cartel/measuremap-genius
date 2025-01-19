import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface MapControlsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
}

const MapControls = ({ isDrawing, onStartDrawing, onCancelDrawing }: MapControlsProps) => {
  return (
    <div className="absolute bottom-4 left-4 flex gap-2">
      {!isDrawing ? (
        <Button onClick={onStartDrawing} className="shadow-lg">
          <MapPin className="mr-2 h-4 w-4" />
          Start Measuring
        </Button>
      ) : (
        <Button variant="destructive" onClick={onCancelDrawing} className="shadow-lg">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
};

export default MapControls;