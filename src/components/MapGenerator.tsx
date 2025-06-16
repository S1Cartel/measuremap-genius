
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, MapPin, Building, TreePine, Car, Utensils, Hospital, School, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface POI {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number];
  icon: React.ReactNode;
  color: string;
}

interface MapGeneratorProps {
  onGenerateMap: (area: string) => void;
  isGenerating: boolean;
  generatedPOIs: POI[];
  boundaryCoordinates: number[][];
  areaName: string;
}

const MapGenerator = ({ onGenerateMap, isGenerating, generatedPOIs, boundaryCoordinates, areaName }: MapGeneratorProps) => {
  const [searchArea, setSearchArea] = useState('');

  const handleGenerate = () => {
    if (!searchArea.trim()) {
      toast({
        title: "Please enter an area",
        description: "Enter a city, country, or region name to generate a map",
        variant: "destructive"
      });
      return;
    }
    onGenerateMap(searchArea);
  };

  const handleDownload = () => {
    // Create downloadable interactive HTML map
    const mapHTML = generateInteractiveMapHTML(areaName, generatedPOIs, boundaryCoordinates);
    const blob = new Blob([mapHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${areaName.replace(/\s+/g, '_')}_map.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Map Downloaded",
      description: "Interactive map saved successfully",
    });
  };

  const generateInteractiveMapHTML = (name: string, pois: POI[], boundary: number[][]) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${name} - Professional Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; font-family: 'Arial', sans-serif; background: #0f0f23; color: white; }
        #map { height: 100vh; width: 100%; }
        .legend { position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; z-index: 1000; }
        .legend-item { display: flex; align-items: center; margin: 5px 0; }
        .legend-icon { width: 20px; height: 20px; margin-right: 10px; border-radius: 50%; }
        .scale { position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 10px; z-index: 1000; }
        .title { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; z-index: 1000; }
        .tooltip { background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 5px; border: none; }
    </style>
</head>
<body>
    <div class="title">
        <h2>${name} - Professional Map</h2>
        <p>Interactive mapping solution</p>
    </div>
    <div id="map"></div>
    <div class="legend">
        <h4>Legend</h4>
        <div class="legend-item"><div class="legend-icon" style="background: #8b5cf6;"></div>Restaurants</div>
        <div class="legend-item"><div class="legend-icon" style="background: #10b981;"></div>Parks</div>
        <div class="legend-item"><div class="legend-icon" style="background: #f59e0b;"></div>Shopping</div>
        <div class="legend-item"><div class="legend-icon" style="background: #ef4444;"></div>Healthcare</div>
        <div class="legend-item"><div class="legend-icon" style="background: #3b82f6;"></div>Education</div>
        <div class="legend-item"><div class="legend-icon" style="background: #6b7280;"></div>Transportation</div>
    </div>
    <div class="scale">
        <div>Scale: 1:25,000</div>
        <div>Generated: ${new Date().toLocaleDateString()}</div>
    </div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map', {
            style: 'dark',
            zoomControl: true
        });
        
        L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors, © CartoDB'
        }).addTo(map);
        
        ${boundary.length > 0 ? `
        const boundary = ${JSON.stringify(boundary)};
        const polygon = L.polygon(boundary, {
            color: '#8b5cf6',
            weight: 3,
            fillColor: '#8b5cf6',
            fillOpacity: 0.1
        }).addTo(map);
        map.fitBounds(polygon.getBounds());
        ` : ''}
        
        ${pois.map(poi => `
        L.marker([${poi.coordinates[1]}, ${poi.coordinates[0]}])
            .addTo(map)
            .bindTooltip('<div class="tooltip"><strong>${poi.name}</strong><br>Category: ${poi.category}</div>', {
                permanent: false,
                direction: 'top'
            });
        `).join('')}
    </script>
</body>
</html>`;
  };

  const poiCategories = [
    { name: 'Restaurants', icon: <Utensils className="h-4 w-4" />, color: '#8b5cf6', count: generatedPOIs.filter(p => p.category === 'restaurant').length },
    { name: 'Parks', icon: <TreePine className="h-4 w-4" />, color: '#10b981', count: generatedPOIs.filter(p => p.category === 'park').length },
    { name: 'Shopping', icon: <ShoppingBag className="h-4 w-4" />, color: '#f59e0b', count: generatedPOIs.filter(p => p.category === 'shopping').length },
    { name: 'Healthcare', icon: <Hospital className="h-4 w-4" />, color: '#ef4444', count: generatedPOIs.filter(p => p.category === 'healthcare').length },
    { name: 'Education', icon: <School className="h-4 w-4" />, color: '#3b82f6', count: generatedPOIs.filter(p => p.category === 'education').length },
    { name: 'Transport', icon: <Car className="h-4 w-4" />, color: '#6b7280', count: generatedPOIs.filter(p => p.category === 'transport').length },
  ];

  return (
    <Card className="bg-black/90 border-violet-500/30 p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Professional Map Generator</h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter city, country, or region..."
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>

        {areaName && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-300">Generated: {areaName}</h4>
              <Button 
                onClick={handleDownload}
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Map
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {poiCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg">
                  <div className="text-white" style={{ color: category.color }}>
                    {category.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{category.name}</div>
                    <div className="text-sm font-medium text-white">{category.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MapGenerator;
