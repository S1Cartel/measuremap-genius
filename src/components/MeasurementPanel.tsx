import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Measurement } from '../pages/Index';
import { jsPDF } from 'jspdf';

interface MeasurementPanelProps {
  measurement: Measurement | null;
}

const MeasurementPanel = ({ measurement }: MeasurementPanelProps) => {
  const generatePDF = () => {
    if (!measurement) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Roof Measurement Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Area: ${measurement.area.toFixed(2)} square meters`, 20, 40);
    doc.text(`Perimeter: ${measurement.perimeter.toFixed(2)} meters`, 20, 50);
    
    doc.save('roof-measurement.pdf');
  };

  return (
    <div className="w-96 bg-white p-6 shadow-lg overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Measurement Details</h2>
      
      {measurement ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Area</h3>
              <p className="text-2xl font-bold text-gray-900">
                {measurement.area.toFixed(2)} m²
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Perimeter</h3>
              <p className="text-2xl font-bold text-gray-900">
                {measurement.perimeter.toFixed(2)} m
              </p>
            </div>
          </div>

          <Button onClick={generatePDF} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p>No measurement taken yet.</p>
          <p className="text-sm mt-2">Click "Start Measuring" and draw a polygon on the map.</p>
        </div>
      )}
    </div>
  );
};

export default MeasurementPanel;