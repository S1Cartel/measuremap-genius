import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import { generatePOIsForArea, fetchAreaBoundary } from '@/components/POIService';
import InteractiveMapLegend from '@/components/InteractiveMapLegend';
import MapControls from '@/components/MapControls';
import MeasurementHistory from '@/components/MeasurementHistory';
import Navbar from '@/components/enhanced/Navbar';
import ProjectManager from '@/components/enhanced/ProjectManager';
import EnhancedMeasurementPanel from '@/components/enhanced/EnhancedMeasurementPanel';
import ShareDialog from '@/components/enhanced/ShareDialog';
import { Button } from '@/components/ui/button';
import { Share2, BarChart3, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Define types for measurements
export interface Measurement {
  id: string;
  type: 'polygon' | 'circle' | 'line';
  coordinates: number[][];
  area?: number;
  perimeter?: number;
  distance?: number;
  radius?: number;
  center_point?: number[];
  location?: string;
  name?: string;
  notes?: string;
  tags?: string[];
  is_favorite?: boolean;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'circle' | 'line'>('polygon');
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default London
  const [mapZoom, setMapZoom] = useState(13);
  const [areaName, setAreaName] = useState('London');
  const [areaBoundary, setAreaBoundary] = useState<number[][]>([]);
  const [pois, setPois] = useState([]);
  const [visibleCategories, setVisibleCategories] = useState(new Set<string>());
  const [showHistory, setShowHistory] = useState(false);
  const [showMapGenerator, setShowMapGenerator] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      const boundary = await fetchAreaBoundary(areaName);
      setAreaBoundary(boundary);
      
      const generatedPOIs = await generatePOIsForArea(areaName, boundary);
      setPois(generatedPOIs);
    };
    
    loadData();
  }, [areaName]);

  const handleAreaNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAreaName(event.target.value);
  };

  const handleSearchArea = async () => {
    const boundary = await fetchAreaBoundary(areaName);
    setAreaBoundary(boundary);
    
    if (boundary.length > 0) {
      // Calculate the center of the bounding box
      const latitudes = boundary.map(coord => coord[1]);
      const longitudes = boundary.map(coord => coord[0]);
      const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
      
      setMapCenter([avgLat, avgLng]);
      setMapZoom(13);
    }
    
    const generatedPOIs = await generatePOIsForArea(areaName, boundary);
    setPois(generatedPOIs);
  };

  const handleCreate = (e: any) => {
    setIsDrawing(false);
    
    let newMeasurement: Measurement;
    
    if (e.layerType === 'polygon') {
      const latlngs = e.layer.getLatLngs()[0].map((latlng: any) => [latlng.lng, latlng.lat]);
      const area = L.GeometryUtil.geodesicArea(e.layer.getLatLngs()[0]);
      const perimeter = calculatePolygonPerimeter(latlngs);
      
      newMeasurement = {
        id: crypto.randomUUID(),
        type: 'polygon',
        coordinates: latlngs,
        area: area,
        perimeter: perimeter
      };
    } else if (e.layerType === 'circle') {
      const center = [e.layer.getLatLng().lng, e.layer.getLatLng().lat];
      const radius = e.layer.getRadius();
      const area = Math.PI * radius * radius;
      
      newMeasurement = {
        id: crypto.randomUUID(),
        type: 'circle',
        coordinates: [center],
        radius: radius,
        area: area,
        center_point: center
      };
    } else if (e.layerType === 'polyline') {
      const latlngs = e.layer.getLatLngs().map((latlng: any) => [latlng.lng, latlng.lat]);
      const distance = calculateLineDistance(latlngs);
      
      newMeasurement = {
        id: crypto.randomUUID(),
        type: 'line',
        coordinates: latlngs,
        distance: distance
      };
    } else {
      console.warn('Unsupported layer type:', e.layerType);
      return;
    }
    
    setCurrentMeasurement(newMeasurement);
    setMeasurements(prevMeasurements => [...prevMeasurements, newMeasurement]);
  };

  const handleUpdate = (e: any) => {
    console.log('EDITED', e);
    // Handle edit event
  };

  const handleDelete = (e: any) => {
    console.log('DELETED', e);
    // Handle delete event
  };

  const handleDrawing = () => {
    setIsDrawing(true);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setCurrentMeasurement(null);
  };

  const handleClearAll = () => {
    setMeasurements([]);
    setCurrentMeasurement(null);
  };

  const handleToggleCategory = (category: string, visible: boolean) => {
    const newVisibleCategories = new Set(visibleCategories);
    if (visible) {
      newVisibleCategories.add(category);
    } else {
      newVisibleCategories.delete(category);
    }
    setVisibleCategories(newVisibleCategories);
  };

  const calculatePolygonPerimeter = (latlngs: number[][]): number => {
    let perimeter = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      const point1 = L.latLng(latlngs[i][1], latlngs[i][0]);
      const point2 = L.latLng(latlngs[i + 1][1], latlngs[i + 1][0]);
      perimeter += point1.distanceTo(point2);
    }
    
    // Close the polygon
    const lastPoint = L.latLng(latlngs[latlngs.length - 1][1], latlngs[latlngs.length - 1][0]);
    const firstPoint = L.latLng(latlngs[0][1], latlngs[0][0]);
    perimeter += lastPoint.distanceTo(firstPoint);
    
    return perimeter;
  };

  const calculateLineDistance = (latlngs: number[][]): number => {
    let distance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      const point1 = L.latLng(latlngs[i][1], latlngs[i][0]);
      const point2 = L.latLng(latlngs[i + 1][1], latlngs[i + 1][0]);
      distance += point1.distanceTo(point2);
    }
    return distance;
  };

  const handleSelectMeasurement = (measurement: Measurement) => {
    setCurrentMeasurement(measurement);
  };

  const handleDeleteMeasurement = (index: number) => {
    setMeasurements(prevMeasurements => {
      const newMeasurements = [...prevMeasurements];
      newMeasurements.splice(index, 1);
      return newMeasurements;
    });
    setCurrentMeasurement(null);
  };

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleToggleMapGenerator = () => {
    setShowMapGenerator(!showMapGenerator);
  };

  const handleDrawingModeChange = (mode: 'polygon' | 'circle' | 'line') => {
    setDrawingMode(mode);
  };

  const handleAIAnalysis = async () => {
    if (!currentMeasurement) return;

    try {
      const { data, error } = await supabase.functions.invoke('ai-land-analysis', {
        body: {
          coordinates: currentMeasurement.coordinates,
          measurementType: currentMeasurement.type
        }
      });

      if (error) throw error;

      setAnalysisData(data);
      toast({
        title: "AI Analysis Complete",
        description: "Advanced land analysis has been generated"
      });
    } catch (error) {
      console.error('Error in AI analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to generate AI analysis",
        variant: "destructive"
      });
    }
  };

  const generateReport = async () => {
    if (!selectedProject || measurements.length === 0) return;

    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          projectData: selectedProject,
          measurements: measurements,
          analysisData: analysisData
        }
      });

      if (error) throw error;

      // Create and download the report
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedProject.name}-report.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Comprehensive project report has been downloaded"
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-80 p-4 space-y-4 overflow-y-auto">
          <ProjectManager 
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />
          
          {selectedProject && (
            <div className="space-y-2">
              <Button
                onClick={() => setShareDialogOpen(true)}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Project
              </Button>
              
              <Button
                onClick={handleAIAnalysis}
                disabled={!currentMeasurement}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Analysis
              </Button>
              
              <Button
                onClick={generateReport}
                disabled={measurements.length === 0 || generatingReport}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          )}
          
          <EnhancedMeasurementPanel
            measurement={currentMeasurement}
            projectId={selectedProject?.id || null}
            onSave={() => {
              // Refresh measurements or update UI as needed
              toast({
                title: "Measurement Saved",
                description: "Your measurement has been saved to the project"
              });
            }}
          />
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {areaBoundary.length > 0 && (
              <Polygon positions={areaBoundary.map(coord => [coord[1], coord[0]])} color="purple" />
            )}
            
            {pois.map(poi => {
              if (!visibleCategories.has(poi.category)) {
                return null;
              }
              
              return (
                <Circle
                  key={poi.id}
                  center={[poi.coordinates[1], poi.coordinates[0]]}
                  radius={20}
                  fillColor={poi.color}
                  fillOpacity={0.5}
                  stroke={false}
                />
              );
            })}
            
            {measurements.map(measurement => {
              if (measurement.type === 'polygon') {
                return (
                  <Polygon 
                    key={measurement.id}
                    positions={measurement.coordinates.map(coord => [coord[1], coord[0]])}
                    color="violet"
                  />
                );
              } else if (measurement.type === 'circle') {
                return (
                  <Circle
                    key={measurement.id}
                    center={[measurement.coordinates[0][1], measurement.coordinates[0][0]]}
                    radius={measurement.radius || 100}
                    color="teal"
                  />
                );
              } else if (measurement.type === 'line') {
                return (
                  <Polyline
                    key={measurement.id}
                    positions={measurement.coordinates.map(coord => [coord[1], coord[0]])}
                    color="orange"
                  />
                );
              }
              return null;
            })}

            <FeatureGroup>
              <EditControl
                position="topright"
                draw={{
                  polygon: drawingMode === 'polygon',
                  circle: drawingMode === 'circle',
                  polyline: drawingMode === 'line',
                  rectangle: false,
                  marker: false,
                  circlemarker: false
                }}
                onCreated={handleCreate}
                onEdited={handleUpdate}
                onDeleted={handleDelete}
              />
            </FeatureGroup>
          </MapContainer>
          
          <InteractiveMapLegend
            pois={pois}
            onToggleCategory={handleToggleCategory}
            visibleCategories={visibleCategories}
          />
          
          <MapControls
            isDrawing={isDrawing}
            onStartDrawing={handleDrawing}
            onCancelDrawing={handleCancelDrawing}
            onClearAll={handleClearAll}
            onToggleHistory={handleToggleHistory}
            onToggleMapGenerator={handleToggleMapGenerator}
            drawingMode={drawingMode}
            onDrawingModeChange={handleDrawingModeChange}
          />
          
          {showHistory && (
            <MeasurementHistory
              measurements={measurements}
              onSelectMeasurement={handleSelectMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      </div>

      {selectedProject && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
};

export default Index;
