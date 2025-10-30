import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Activity } from "@/types/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
];

export default function ProjectsManagement() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(COLORS[0]);
  const [loadingData, setLoadingData] = useState(true);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true });

      if (projectsError) {
        toast.error('Failed to load projects');
        console.error(projectsError);
      } else if (projectsData) {
        setProjects(projectsData);
      }

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          activity_tags(tag_id)
        `)
        .order('date', { ascending: false });

      if (activitiesError) {
        toast.error('Failed to load activities');
        console.error(activitiesError);
      } else if (activitiesData) {
        const parsedActivities = activitiesData.map((a) => ({
          id: a.id,
          name: a.description,
          duration: a.duration,
          startTime: new Date(a.date),
          endTime: new Date(new Date(a.date).getTime() + a.duration),
          projectId: a.project_id || undefined,
          tagIds: a.activity_tags?.map((at: any) => at.tag_id) || [],
        }));
        setActivities(parsedActivities);
      }

      setLoadingData(false);
    };

    loadData();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user || !projectName.trim()) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectName.trim(),
        color: projectColor,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create project');
      console.error(error);
      return;
    }

    if (data) {
      setProjects([...projects, data]);
      setProjectName("");
      setProjectColor(COLORS[0]);
      setIsCreating(false);
      toast.success('Project created');
    }
  };

  const handleUpdateProject = async () => {
    if (!user || !editingProject || !projectName.trim()) return;

    const { error } = await supabase
      .from('projects')
      .update({
        name: projectName.trim(),
        color: projectColor,
      })
      .eq('id', editingProject.id);

    if (error) {
      toast.error('Failed to update project');
      console.error(error);
      return;
    }

    setProjects(prev => 
      prev.map(p => p.id === editingProject.id ? { ...p, name: projectName.trim(), color: projectColor } : p)
    );
    setProjectName("");
    setProjectColor(COLORS[0]);
    setEditingProject(null);
    toast.success('Project updated');
  };

  const handleDeleteProject = async () => {
    if (!user || !deleteProjectId) return;

    // Update activities to remove project reference
    await supabase
      .from('activities')
      .update({ project_id: null })
      .eq('project_id', deleteProjectId);

    // Update active activities
    await supabase
      .from('active_activities')
      .update({ project_id: null })
      .eq('project_id', deleteProjectId);

    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deleteProjectId);

    if (error) {
      toast.error('Failed to delete project');
      console.error(error);
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== deleteProjectId));
    if (selectedProjectId === deleteProjectId) {
      setSelectedProjectId(null);
    }
    setDeleteProjectId(null);
    toast.success('Project deleted');
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectColor(project.color);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setIsCreating(false);
    setProjectName("");
    setProjectColor(COLORS[0]);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredActivities = selectedProjectId
    ? activities.filter(a => a.projectId === selectedProjectId)
    : [];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Manage Projects</h1>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(isCreating || editingProject) && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        editingProject ? handleUpdateProject() : handleCreateProject();
                      }
                      if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setProjectColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform hover:scale-110",
                          projectColor === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={editingProject ? handleUpdateProject : handleCreateProject}
                      disabled={!projectName.trim()}
                      className="flex-1"
                    >
                      {editingProject ? "Save" : "Create"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!isCreating && !editingProject && (
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}

              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <span 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 font-medium">{project.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(project);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteProjectId(project.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedProjectId
                  ? `Activities in "${projects.find(p => p.id === selectedProjectId)?.name}"`
                  : "Select a project to view activities"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProjectId && filteredActivities.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No activities in this project
                </p>
              )}
              
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium">{activity.name}</h4>
                      <Badge variant="secondary">
                        {formatDuration(activity.duration)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(activity.startTime, "PPp")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? Activities will keep their data but will no longer be associated with this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
