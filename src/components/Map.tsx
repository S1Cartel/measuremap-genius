import { useEffect, useRef, useState } from 'react';
import type { Measurement } from '../pages/Index';

interface MapProps {
  isDrawing: boolean;
  onMeasurementComplete: (measurement: Measurement) => void;
}

const Map = ({ isDrawing, onMeasurementComplete }: MapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const points = useRef<[number, number][]>([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.strokeStyle = '#2563eb';
    context.lineWidth = 2;
    contextRef.current = context;
  }, []);

  const calculateArea = (points: [number, number][]) => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    return Math.abs(area / 2);
  };

  const calculatePerimeter = (points: [number, number][]) => {
    if (points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j][0] - points[i][0];
      const dy = points[j][1] - points[i][1];
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.current.push([x, y]);

    const ctx = contextRef.current;
    
    // Draw point
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#2563eb';
    ctx.fill();

    // Draw line
    if (points.current.length > 1) {
      const prevPoint = points.current[points.current.length - 2];
      ctx.beginPath();
      ctx.moveTo(prevPoint[0], prevPoint[1]);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Check if polygon should be closed
    if (points.current.length >= 3) {
      const firstPoint = points.current[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint[0], 2) + Math.pow(y - firstPoint[1], 2)
      );

      if (distance < 20) {
        // Close the polygon
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(firstPoint[0], firstPoint[1]);
        ctx.stroke();

        // Calculate measurements (using pixel values as units)
        const area = calculateArea(points.current);
        const perimeter = calculatePerimeter(points.current);

        onMeasurementComplete({
          area,
          perimeter,
          coordinates: points.current,
        });

        // Reset
        points.current = [];
        setIsDrawingActive(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-gray-200"
        onClick={handleCanvasClick}
      />
      {!isDrawing && (
        <div className="absolute top-4 left-4 right-4 bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-600">
            Click "Start Measuring" to begin drawing a polygon.
          </p>
        </div>
      )}
    </div>
  );
};

export default Map;