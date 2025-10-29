import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProjectSelector } from "./ProjectSelector";
import { TagSelector } from "./TagSelector";
import { Project, Tag } from "@/types/activity";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface ActiveActivity {
  id: string;
  name: string;
  startTime: Date;
  elapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;
  pausedTime: number;
  projectId?: string;
  tagIds: string[];
}

interface MultiActivityTimerProps {
  onActivityComplete: (activity: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    projectId?: string;
    tagIds: string[];
  }) => void;
  projects: Project[];
  tags: Tag[];
  onCreateProject: (name: string, color: string) => void;
  onCreateTag: (name: string, color: string) => void;
  user: User;
}

export const MultiActivityTimer = ({
  onActivityComplete,
  projects,
  tags,
  onCreateProject,
  onCreateTag,
  user,
}: MultiActivityTimerProps) => {
  const [activities, setActivities] = useState<ActiveActivity[]>([]);
  const [newActivityName, setNewActivityName] = useState("");
  const [loading, setLoading] = useState(true);
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load active activities from database
  useEffect(() => {
    const loadActiveActivities = async () => {
      const { data: activeActivitiesData, error } = await supabase
        .from('active_activities')
        .select(`
          *,
          active_activity_tags(tag_id)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading active activities:', error);
        toast.error('Failed to load active activities');
        setLoading(false);
        return;
      }

      if (activeActivitiesData) {
        const loadedActivities: ActiveActivity[] = activeActivitiesData.map(act => ({
          id: act.id,
          name: act.description,
          startTime: new Date(act.start_time),
          elapsedTime: act.elapsed_time,
          isRunning: act.is_running,
          isPaused: !act.is_running,
          pausedTime: act.paused_time || 0,
          projectId: act.project_id || undefined,
          tagIds: act.active_activity_tags?.map((t: any) => t.tag_id) || [],
        }));

        setActivities(loadedActivities);

        // Start intervals for running activities
        loadedActivities.forEach(act => {
          if (act.isRunning && !act.isPaused) {
            const interval = setInterval(() => {
              setActivities(prev =>
                prev.map(a =>
                  a.id === act.id && a.isRunning && !a.isPaused
                    ? { ...a, elapsedTime: Date.now() - a.startTime.getTime() - a.pausedTime }
                    : a
                )
              );
            }, 100);
            intervalRefs.current.set(act.id, interval);
          }
        });
      }

      setLoading(false);
    };

    loadActiveActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('active_activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_activities',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: tagsData } = await supabase
              .from('active_activity_tags')
              .select('tag_id')
              .eq('active_activity_id', payload.new.id);

            const newActivity: ActiveActivity = {
              id: payload.new.id,
              name: payload.new.description,
              startTime: new Date(payload.new.start_time),
              elapsedTime: payload.new.elapsed_time,
              isRunning: payload.new.is_running,
              isPaused: !payload.new.is_running,
              pausedTime: payload.new.paused_time || 0,
              projectId: payload.new.project_id || undefined,
              tagIds: tagsData?.map(t => t.tag_id) || [],
            };

            setActivities(prev => {
              // Check if activity already exists
              if (prev.some(a => a.id === newActivity.id)) return prev;
              
              const updated = [...prev, newActivity];
              
              // Start interval if running
              if (newActivity.isRunning && !newActivity.isPaused) {
                const interval = setInterval(() => {
                  setActivities(current =>
                    current.map(a =>
                      a.id === newActivity.id && a.isRunning && !a.isPaused
                        ? { ...a, elapsedTime: Date.now() - a.startTime.getTime() - a.pausedTime }
                        : a
                    )
                  );
                }, 100);
                intervalRefs.current.set(newActivity.id, interval);
              }
              
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedActivity = payload.new;
            
            setActivities(prev =>
              prev.map(act => {
                if (act.id === updatedActivity.id) {
                  const newIsRunning = updatedActivity.is_running;
                  const newIsPaused = !newIsRunning;
                  
                  // Manage interval based on running state
                  if (newIsRunning && !newIsPaused) {
                    // Start interval if not already running
                    if (!intervalRefs.current.has(act.id)) {
                      const interval = setInterval(() => {
                        setActivities(current =>
                          current.map(a =>
                            a.id === updatedActivity.id && a.isRunning && !a.isPaused
                              ? { ...a, elapsedTime: Date.now() - a.startTime.getTime() - a.pausedTime }
                              : a
                          )
                        );
                      }, 100);
                      intervalRefs.current.set(act.id, interval);
                    }
                  } else {
                    // Clear interval if paused
                    const interval = intervalRefs.current.get(act.id);
                    if (interval) {
                      clearInterval(interval);
                      intervalRefs.current.delete(act.id);
                    }
                  }
                  
                  return {
                    ...act,
                    elapsedTime: updatedActivity.elapsed_time,
                    isRunning: newIsRunning,
                    isPaused: newIsPaused,
                    pausedTime: updatedActivity.paused_time || 0,
                    projectId: updatedActivity.project_id || undefined,
                  };
                }
                return act;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const interval = intervalRefs.current.get(payload.old.id);
            if (interval) {
              clearInterval(interval);
              intervalRefs.current.delete(payload.old.id);
            }
            setActivities(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Periodically sync running activities to database
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const runningActivities = activities.filter(a => a.isRunning && !a.isPaused);
      
      for (const activity of runningActivities) {
        await supabase
          .from('active_activities')
          .update({
            elapsed_time: activity.elapsedTime,
          })
          .eq('id', activity.id);
      }
    }, 5000); // Sync every 5 seconds

    return () => clearInterval(syncInterval);
  }, [activities]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const startNewActivity = async () => {
    if (!newActivityName.trim()) return;

    const startTime = new Date();

    const { data, error } = await supabase
      .from('active_activities')
      .insert({
        user_id: user.id,
        description: newActivityName,
        start_time: startTime.toISOString(),
        elapsed_time: 0,
        is_running: true,
        paused_time: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating active activity:', error);
      toast.error('Failed to start activity');
      return;
    }

    setNewActivityName("");
    // Activity will be added via realtime subscription
  };

  const togglePause = async (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const newIsPaused = !activity.isPaused;
    const newPausedTime = newIsPaused
      ? activity.pausedTime
      : activity.pausedTime + (Date.now() - activity.startTime.getTime() - activity.elapsedTime);

    const { error } = await supabase
      .from('active_activities')
      .update({
        is_running: !newIsPaused,
        paused_time: newPausedTime,
        elapsed_time: activity.elapsedTime,
      })
      .eq('id', id);

    if (error) {
      console.error('Error toggling pause:', error);
      toast.error('Failed to update activity');
      return;
    }

    // Clear or start interval based on pause state
    if (newIsPaused) {
      const interval = intervalRefs.current.get(id);
      if (interval) {
        clearInterval(interval);
        intervalRefs.current.delete(id);
      }
    } else {
      const interval = setInterval(() => {
        setActivities(prev =>
          prev.map(act =>
            act.id === id && act.isRunning && !act.isPaused
              ? { ...act, elapsedTime: Date.now() - act.startTime.getTime() - act.pausedTime }
              : act
          )
        );
      }, 100);
      intervalRefs.current.set(id, interval);
    }
  };

  const stopActivity = async (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
    }

    const endTime = new Date(activity.startTime.getTime() + activity.elapsedTime);

    // Delete from active_activities (will trigger realtime DELETE)
    const { error } = await supabase
      .from('active_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting active activity:', error);
      toast.error('Failed to stop activity');
      return;
    }

    // Save to completed activities
    onActivityComplete({
      name: activity.name,
      duration: activity.elapsedTime,
      startTime: activity.startTime,
      endTime,
      projectId: activity.projectId,
      tagIds: activity.tagIds,
    });
  };

  const cancelActivity = async (id: string) => {
    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
    }

    // Delete from database
    const { error } = await supabase
      .from('active_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error canceling active activity:', error);
      toast.error('Failed to cancel activity');
    }
  };

  const updateActivityProject = async (id: string, projectId: string | undefined) => {
    const { error } = await supabase
      .from('active_activities')
      .update({ project_id: projectId || null })
      .eq('id', id);

    if (error) {
      console.error('Error updating activity project:', error);
      toast.error('Failed to update project');
      return;
    }

    setActivities(prev =>
      prev.map(act => (act.id === id ? { ...act, projectId } : act))
    );
  };

  const toggleActivityTag = async (id: string, tagId: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const isAdding = !activity.tagIds.includes(tagId);

    if (isAdding) {
      const { error } = await supabase
        .from('active_activity_tags')
        .insert({ active_activity_id: id, tag_id: tagId });

      if (error) {
        console.error('Error adding tag:', error);
        toast.error('Failed to add tag');
        return;
      }
    } else {
      const { error } = await supabase
        .from('active_activity_tags')
        .delete()
        .eq('active_activity_id', id)
        .eq('tag_id', tagId);

      if (error) {
        console.error('Error removing tag:', error);
        toast.error('Failed to remove tag');
        return;
      }
    }

    setActivities(prev =>
      prev.map(act => {
        if (act.id === id) {
          const tagIds = isAdding
            ? [...act.tagIds, tagId]
            : act.tagIds.filter(t => t !== tagId);
          return { ...act, tagIds };
        }
        return act;
      })
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading active timers...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex gap-2">
          <Input
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="What are you working on?"
            onKeyPress={(e) => e.key === "Enter" && startNewActivity()}
            className="flex-1"
          />
          <Button onClick={startNewActivity} disabled={!newActivityName.trim()}>
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        </div>
      </Card>

      {activities.map(activity => (
        <Card key={activity.id} className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-1">{activity.name}</h3>
                <div
                  className={cn(
                    "text-3xl font-mono font-bold tabular-nums",
                    activity.isRunning && !activity.isPaused ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {formatTime(activity.elapsedTime)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cancelActivity(activity.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Project</label>
                <ProjectSelector
                  projects={projects}
                  selectedProjectId={activity.projectId}
                  onSelectProject={(id) => updateActivityProject(activity.id, id)}
                  onCreateProject={onCreateProject}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Tags</label>
                <TagSelector
                  tags={tags}
                  selectedTagIds={activity.tagIds}
                  onToggleTag={(tagId) => toggleActivityTag(activity.id, tagId)}
                  onCreateTag={onCreateTag}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => togglePause(activity.id)}
                variant="outline"
                className="flex-1"
              >
                {activity.isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={() => stopActivity(activity.id)}
                variant="default"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No active timers</p>
          <p className="text-sm mt-1">Start tracking an activity above</p>
        </div>
      )}
    </div>
  );
};