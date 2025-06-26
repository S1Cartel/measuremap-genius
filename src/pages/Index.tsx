
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import MapComponent from '@/components/Map';
import { generatePOIsForArea, fetchAreaBoundary } from '@/components/POIService';
import MapControls from '@/components/MapControls';
import MeasurementHistory from '@/components/MeasurementHistory';
import Navbar from '@/components/enhanced/Navbar';
import ProjectManager from '@/components/enhanced/ProjectManager';
import EnhancedMeasurementPanel from '@/components/enhanced/EnhancedMeasurementPanel';
import ShareDialog from '@/components/enhanced/ShareDialog';
import { Button } from '@/components/ui/button';
import { Share2, BarChart3, FileText, Sparkles, LogIn } from 'lucide-react';
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
  const [areaName, setAreaName] = useState('London');
  const [areaBoundary, setAreaBoundary] = useState<number[][]>([]);
  const [pois, setPois] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [shouldClear, setShouldClear] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // Allow guest access - don't redirect to auth immediately
  useEffect(() => {
    if (!authLoading && !user) {
      setIsGuest(true);
    } else if (user) {
      setIsGuest(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    const loadData = async () => {
      const boundary = await fetchAreaBoundary(areaName);
      setAreaBoundary(boundary);
      
      const generatedPOIs = await generatePOIsForArea(areaName, boundary);
      setPois(generatedPOIs);
    };
    
    loadData();
  }, [areaName]);

  const handleMeasurementComplete = (measurement: Measurement) => {
    setCurrentMeasurement(measurement);
    setMeasurements(prev => [...prev, measurement]);
    setIsDrawing(false);
  };

  const handleStartDrawing = () => {
    setIsDrawing(true);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearAll = () => {
    setMeasurements([]);
    setCurrentMeasurement(null);
    setShouldClear(false);
  };

  const handleSelectMeasurement = (measurement: Measurement) => {
    setCurrentMeasurement(measurement);
  };

  const handleDeleteMeasurement = (index: number) => {
    setMeasurements(prev => {
      const newMeasurements = [...prev];
      newMeasurements.splice(index, 1);
      return newMeasurements;
    });
    setCurrentMeasurement(null);
  };

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleDrawingModeChange = (mode: 'polygon' | 'circle' | 'line') => {
    setDrawingMode(mode);
  };

  const handlePOIsGenerated = (newPois: any[]) => {
    setPois(newPois);
  };

  const handleAIAnalysis = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to use AI analysis features",
        variant: "destructive"
      });
      return;
    }

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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to generate reports",
        variant: "destructive"
      });
      return;
    }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-80 p-4 space-y-4 overflow-y-auto">
          {isGuest && (
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-violet-500/30">
              <h3 className="text-lg font-semibold text-white mb-2">Guest Mode</h3>
              <p className="text-gray-300 text-sm mb-4">
                You're using GeoMeasure Pro as a guest. Sign in to access advanced features like project management, AI analysis, and report generation.
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          )}

          {user && (
            <>
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
            </>
          )}
          
          <EnhancedMeasurementPanel
            measurement={currentMeasurement}
            projectId={user && selectedProject ? selectedProject.id : null}
            onSave={() => {
              if (user) {
                toast({
                  title: "Measurement Saved",
                  description: "Your measurement has been saved to the project"
                });
              } else {
                toast({
                  title: "Guest Mode",
                  description: "Sign in to save measurements to projects",
                  variant: "destructive"
                });
              }
            }}
          />
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <MapComponent
            isDrawing={isDrawing}
            onMeasurementComplete={handleMeasurementComplete}
            drawingMode={drawingMode}
            onClearAll={handleClearAll}
            shouldClear={shouldClear}
            generatedPOIs={pois}
            areaBoundary={areaBoundary}
            areaName={areaName}
            onPOIsGenerated={handlePOIsGenerated}
          />
          
          <MapControls
            isDrawing={isDrawing}
            onStartDrawing={handleStartDrawing}
            onCancelDrawing={handleCancelDrawing}
            onClearAll={() => setShouldClear(true)}
            onToggleHistory={handleToggleHistory}
            onToggleMapGenerator={() => {}}
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

      {user && selectedProject && (
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
