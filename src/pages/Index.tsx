import { useState, useEffect } from "react";
import { ActivityTimer } from "@/components/ActivityTimer";
import { ActivityList } from "@/components/ActivityList";
import { RecentActivitiesPanel } from "@/components/RecentActivitiesPanel";
import { Activity, Project, Tag } from "@/types/activity";
import { Clock } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("workActivities");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((a: Activity) => ({
        ...a,
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
        tagIds: a.tagIds || [],
      }));
    }
    return [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("workProjects");
    return saved ? JSON.parse(saved) : [];
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem("workTags");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("workActivities", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("workProjects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("workTags", JSON.stringify(tags));
  }, [tags]);

  const handleActivityComplete = (activity: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    projectId?: string;
    tagIds: string[];
  }) => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      ...activity,
    };

    setActivities((prev) => [newActivity, ...prev]);
    toast.success("Activity recorded!", {
      description: `${activity.name} - ${formatDuration(activity.duration)}`,
    });
  };

  const handleCreateProject = (name: string, color: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    setProjects((prev) => [...prev, newProject]);
    toast.success("Project created!", { description: name });
  };

  const handleCreateTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    setTags((prev) => [...prev, newTag]);
    toast.success("Tag created!", { description: name });
  };

  const handleDelete = (id: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Work Activity Tracker
          </h1>
          <p className="text-muted-foreground text-lg">
            Record your work activities as you do them
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-8">
            <ActivityTimer 
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
      </div>
    </div>
  );
};

export default Index;
