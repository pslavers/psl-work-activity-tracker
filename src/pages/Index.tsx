import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MultiActivityTimer } from "@/components/MultiActivityTimer";
import { ActivityList } from "@/components/ActivityList";
import { RecentActivitiesPanel } from "@/components/RecentActivitiesPanel";
import { AddActivityDialog } from "@/components/AddActivityDialog";
import { EditActivityDialog } from "@/components/EditActivityDialog";
import { Activity, Project, Tag } from "@/types/activity";
import { Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load data from database
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        toast.error('Failed to load projects');
        console.error(projectsError);
      } else if (projectsData) {
        setProjects(projectsData);
      }

      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (tagsError) {
        toast.error('Failed to load tags');
        console.error(tagsError);
      } else if (tagsData) {
        setTags(tagsData);
      }

      // Load activities with their tags
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


  const handleActivityComplete = async (activity: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    projectId?: string;
    tagIds: string[];
  }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        project_id: activity.projectId || null,
        description: activity.name,
        duration: activity.duration,
        date: activity.startTime.toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save activity");
      console.error(error);
      return;
    }

    // Create activity_tags entries
    if (activity.tagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from('activity_tags')
        .insert(
          activity.tagIds.map(tagId => ({
            activity_id: data.id,
            tag_id: tagId,
          }))
        );

      if (tagsError) {
        console.error('Error saving activity tags:', tagsError);
      }
    }

    const newActivity: Activity = {
      id: data.id,
      name: activity.name,
      duration: activity.duration,
      startTime: activity.startTime,
      endTime: activity.endTime,
      projectId: activity.projectId,
      tagIds: activity.tagIds,
    };

    setActivities((prev) => [newActivity, ...prev]);
    toast.success("Activity recorded!", {
      description: `${activity.name} - ${formatDuration(activity.duration)}`,
    });
  };

  const handleCreateProject = async (name: string, color: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        color,
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
      toast.success('Project created');
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name,
        color,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create tag');
      console.error(error);
      return;
    }

    if (data) {
      setTags([...tags, data]);
      toast.success('Tag created');
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    projectId?: string;
    tagIds: string[];
  }) => {
    if (!user) return;

    // First, update the activity itself
    const { error: activityError } = await supabase
      .from('activities')
      .update({
        description: updates.name,
        duration: updates.duration,
        date: updates.startTime.toISOString(),
        project_id: updates.projectId || null,
      })
      .eq('id', id);

    if (activityError) {
      toast.error("Failed to update activity");
      console.error(activityError);
      return;
    }

    // Delete existing activity_tags
    await supabase
      .from('activity_tags')
      .delete()
      .eq('activity_id', id);

    // Insert new activity_tags
    if (updates.tagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from('activity_tags')
        .insert(
          updates.tagIds.map(tagId => ({
            activity_id: id,
            tag_id: tagId,
          }))
        );

      if (tagsError) {
        console.error('Error updating activity tags:', tagsError);
      }
    }

    // Update local state
    setActivities(prev =>
      prev.map(act =>
        act.id === id
          ? {
              ...act,
              name: updates.name,
              duration: updates.duration,
              startTime: updates.startTime,
              endTime: updates.endTime,
              projectId: updates.projectId,
              tagIds: updates.tagIds,
            }
          : act
      )
    );

    toast.success("Activity updated");
  };

  const handleDelete = async (id: string) => {
    // activity_tags will be automatically deleted due to CASCADE
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete activity");
      console.error(error);
      return;
    }

    setActivities((prev) => prev.filter((a) => a.id !== id));
    toast.success("Activity deleted");
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

  const handleExport = () => {
    if (activities.length === 0) {
      toast.error("No activities to export");
      return;
    }

    let exportText = "WORK ACTIVITY TRACKER - EXPORT\n";
    exportText += "=".repeat(50) + "\n\n";
    exportText += `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}\n`;
    exportText += `Total Activities: ${activities.length}\n`;
    
    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
    exportText += `Total Time Tracked: ${formatDuration(totalDuration)}\n\n`;
    exportText += "=".repeat(50) + "\n\n";

    activities.forEach((activity, index) => {
      exportText += `${index + 1}. ${activity.name}\n`;
      exportText += `   Duration: ${formatDuration(activity.duration)}\n`;
      exportText += `   Time: ${format(activity.startTime, "yyyy-MM-dd HH:mm")} - ${format(activity.endTime, "HH:mm")}\n`;
      
      if (activity.projectId) {
        const project = projects.find(p => p.id === activity.projectId);
        if (project) {
          exportText += `   Project: ${project.name}\n`;
        }
      }
      
      if (activity.tagIds.length > 0) {
        const activityTags = activity.tagIds
          .map(tagId => tags.find(t => t.id === tagId)?.name)
          .filter(Boolean);
        if (activityTags.length > 0) {
          exportText += `   Tags: ${activityTags.join(", ")}\n`;
        }
      }
      
      exportText += "\n";
    });

    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activities-export-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Activities exported!", {
      description: `${activities.length} activities saved to file`,
    });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Work Activity Tracker
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Record your work activities as you do them
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <AddActivityDialog
              projects={projects}
              tags={tags}
              onCreateProject={handleCreateProject}
              onCreateTag={handleCreateTag}
              onAddActivity={handleActivityComplete}
            />
            <Button 
              onClick={handleExport} 
              variant="outline" 
              className="gap-2"
              disabled={activities.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Activities
            </Button>
            <Button 
              onClick={signOut}
              variant="ghost" 
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-8">
            <MultiActivityTimer 
              onActivityComplete={handleActivityComplete}
              projects={projects}
              tags={tags}
              onCreateProject={handleCreateProject}
              onCreateTag={handleCreateTag}
            />
            <ActivityList 
              activities={activities} 
              projects={projects}
              tags={tags}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </div>
          
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <RecentActivitiesPanel
                activities={activities}
                projects={projects}
                tags={tags}
                limit={10}
              />
            </div>
          </div>
        </div>

        <EditActivityDialog
          activity={editingActivity}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          projects={projects}
          tags={tags}
          onCreateProject={handleCreateProject}
          onCreateTag={handleCreateTag}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default Index;
