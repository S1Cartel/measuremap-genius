
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Calendar, Share2, Trash2, Edit3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  is_public: boolean;
  created_at: string;
  measurement_count?: number;
}

interface ProjectManagerProps {
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
}

const ProjectManager = ({ selectedProject, onProjectSelect }: ProjectManagerProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    is_public: false
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          measurements (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithCount = data.map(project => ({
        ...project,
        measurement_count: project.measurements[0]?.count || 0
      }));

      setProjects(projectsWithCount);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!user || !newProject.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...newProject,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([{ ...data, measurement_count: 0 }, ...projects]);
      setNewProject({ name: '', description: '', location: '', is_public: false });
      setIsCreateOpen(false);
      onProjectSelect(data);
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        onProjectSelect(null);
      }

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/80 backdrop-blur-md border-violet-500/30">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 backdrop-blur-md border-violet-500/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-violet-400" />
            Projects
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-violet-500/30">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Input
                  placeholder="Location"
                  value={newProject.location}
                  onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Textarea
                  placeholder="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button onClick={createProject} className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedProject?.id === project.id
                ? 'bg-violet-900/50 border-violet-500'
                : 'bg-gray-800/50 border-gray-700 hover:border-violet-500/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-medium">{project.name}</h3>
              <div className="flex gap-1">
                {project.is_public && <Badge variant="secondary" className="text-xs">Public</Badge>}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 p-1 h-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {project.location && (
              <p className="text-gray-400 text-sm mb-1">{project.location}</p>
            )}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{project.measurement_count || 0} measurements</span>
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectManager;
