import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProjectSelector } from "./ProjectSelector";
import { TagSelector } from "./TagSelector";
import { Project, Tag } from "@/types/activity";

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
}

export const MultiActivityTimer = ({
  onActivityComplete,
  projects,
  tags,
  onCreateProject,
  onCreateTag,
}: MultiActivityTimerProps) => {
  const [activities, setActivities] = useState<ActiveActivity[]>([]);
  const [newActivityName, setNewActivityName] = useState("");
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const startNewActivity = () => {
    if (!newActivityName.trim()) return;

    const newActivity: ActiveActivity = {
      id: crypto.randomUUID(),
      name: newActivityName,
      startTime: new Date(),
      elapsedTime: 0,
      isRunning: true,
      isPaused: false,
      pausedTime: 0,
      projectId: undefined,
      tagIds: [],
    };

    setActivities(prev => [...prev, newActivity]);
    setNewActivityName("");

    const interval = setInterval(() => {
      setActivities(prev =>
        prev.map(act =>
          act.id === newActivity.id && act.isRunning && !act.isPaused
            ? { ...act, elapsedTime: Date.now() - act.startTime.getTime() - act.pausedTime }
            : act
        )
      );
    }, 100);

    intervalRefs.current.set(newActivity.id, interval);
  };

  const togglePause = (id: string) => {
    setActivities(prev =>
      prev.map(act => {
        if (act.id === id) {
          if (!act.isPaused) {
            return { ...act, isPaused: true };
          } else {
            const pauseDuration = Date.now() - act.startTime.getTime() - act.elapsedTime;
            return { ...act, isPaused: false, pausedTime: act.pausedTime + pauseDuration };
          }
        }
        return act;
      })
    );
  };

  const stopActivity = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
    }

    const endTime = new Date(activity.startTime.getTime() + activity.elapsedTime);

    onActivityComplete({
      name: activity.name,
      duration: activity.elapsedTime,
      startTime: activity.startTime,
      endTime,
      projectId: activity.projectId,
      tagIds: activity.tagIds,
    });

    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const cancelActivity = (id: string) => {
    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
    }
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const updateActivityProject = (id: string, projectId: string | undefined) => {
    setActivities(prev =>
      prev.map(act => (act.id === id ? { ...act, projectId } : act))
    );
  };

  const toggleActivityTag = (id: string, tagId: string) => {
    setActivities(prev =>
      prev.map(act => {
        if (act.id === id) {
          const tagIds = act.tagIds.includes(tagId)
            ? act.tagIds.filter(t => t !== tagId)
            : [...act.tagIds, tagId];
          return { ...act, tagIds };
        }
        return act;
      })
    );
  };

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