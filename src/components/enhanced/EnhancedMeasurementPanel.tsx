
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Tag, MapPin, Calendar, Heart, Share2, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Measurement } from '../../pages/Index';

interface EnhancedMeasurementPanelProps {
  measurement: Measurement | null;
  projectId: string | null;
  onSave: () => void;
}

const EnhancedMeasurementPanel = ({ measurement, projectId, onSave }: EnhancedMeasurementPanelProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (measurement) {
      setName(measurement.name || '');
      setNotes(measurement.notes || '');
      setTags(measurement.tags || []);
      setIsFavorite(measurement.is_favorite || false);
    }
  }, [measurement]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const saveMeasurement = async () => {
    if (!user || !measurement || !projectId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('measurements')
        .upsert({
          id: measurement.id,
          project_id: projectId,
          user_id: user.id,
          name: name || `${measurement.type} measurement`,
          type: measurement.type,
          area: measurement.area,
          perimeter: measurement.perimeter,
          distance: measurement.distance,
          radius: measurement.radius,
          coordinates: measurement.coordinates,
          center_point: measurement.center_point,
          location: measurement.location,
          notes,
          tags,
          is_favorite: isFavorite
        });

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          project_id: projectId,
          action: 'measurement_saved',
          details: {
            measurement_id: measurement.id,
            measurement_type: measurement.type,
            measurement_name: name
          }
        });

      toast({
        title: "Success",
        description: "Measurement saved successfully"
      });
      onSave();
    } catch (error) {
      console.error('Error saving measurement:', error);
      toast({
        title: "Error",
        description: "Failed to save measurement",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportMeasurement = () => {
    if (!measurement) return;

    const data = {
      name: name || 'Untitled Measurement',
      type: measurement.type,
      area: measurement.area,
      perimeter: measurement.perimeter,
      distance: measurement.distance,
      coordinates: measurement.coordinates,
      location: measurement.location,
      notes,
      tags,
      created_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'measurement'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!measurement) {
    return (
      <Card className="bg-black/80 backdrop-blur-md border-violet-500/30">
        <CardContent className="p-6 text-center text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No measurement selected</p>
          <p className="text-sm mt-2">Create a measurement to see details here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 backdrop-blur-md border-violet-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-violet-400" />
            Measurement Details
          </span>
          <Button
            onClick={() => setIsFavorite(!isFavorite)}
            variant="ghost"
            size="sm"
            className={isFavorite ? 'text-red-400' : 'text-gray-400'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Measurement name"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-gray-400">Type</div>
            <Badge variant="secondary" className="capitalize">
              {measurement.type}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-gray-400">Created</div>
            <div className="text-white text-xs">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        <div className="space-y-2 text-sm">
          {measurement.type === 'polygon' && measurement.area && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Area:</span>
                <span className="text-violet-300 font-medium">
                  {(measurement.area / 10000).toFixed(2)} ha
                </span>
              </div>
              {measurement.perimeter && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Perimeter:</span>
                  <span className="text-violet-300 font-medium">
                    {(measurement.perimeter / 1000).toFixed(2)} km
                  </span>
                </div>
              )}
            </>
          )}
          
          {measurement.type === 'circle' && (
            <>
              {measurement.area && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Area:</span>
                  <span className="text-violet-300 font-medium">
                    {(measurement.area / 10000).toFixed(2)} ha
                  </span>
                </div>
              )}
              {measurement.radius && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Radius:</span>
                  <span className="text-violet-300 font-medium">
                    {(measurement.radius / 1000).toFixed(2)} km
                  </span>
                </div>
              )}
            </>
          )}
          
          {measurement.type === 'line' && measurement.distance && (
            <div className="flex justify-between">
              <span className="text-gray-400">Distance:</span>
              <span className="text-violet-300 font-medium">
                {(measurement.distance / 1000).toFixed(2)} km
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-gray-700" />

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-violet-300 border-violet-500/50 cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="bg-gray-800 border-gray-700 text-white text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="sm" variant="outline">
              <Tag className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes..."
            className="bg-gray-800 border-gray-700 text-white text-sm"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={saveMeasurement}
            disabled={saving || !user}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={exportMeasurement} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMeasurementPanel;
