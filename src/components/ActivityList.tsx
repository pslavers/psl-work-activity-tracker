import { format } from "date-fns";
import { Trash2, Folder, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Project, Tag } from "@/types/activity";

interface ActivityListProps {
  activities: Activity[];
  projects: Project[];
  tags: Tag[];
  onDelete: (id: string) => void;
  onEdit: (activity: Activity) => void;
  onRestart: (activity: Activity) => void;
}

export const ActivityList = ({ activities, projects, tags, onDelete, onEdit, onRestart }: ActivityListProps) => {
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `< 1m`;
  };

  if (activities.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
      <div className="text-center py-12 text-muted-foreground">
        <p>No activities tracked yet</p>
      </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold px-1 mb-4">Today's Activities</h2>

      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              "bg-card rounded-lg shadow-soft p-4 border border-border",
              "hover:shadow-medium transition-all duration-200",
              "group"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h3 className="font-medium text-foreground truncate mb-1">
                    {activity.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>
                      {formatDuration(activity.duration)}
                    </span>
                    <span>•</span>
                    <span>
                      {format(activity.startTime, "HH:mm")} - {format(activity.endTime, "HH:mm")}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {activity.projectId && (() => {
                    const project = projects.find(p => p.id === activity.projectId);
                    return project ? (
                      <Badge 
                        variant="outline" 
                        className="gap-1.5"
                        style={{ 
                          backgroundColor: `${project.color}15`,
                          borderColor: project.color,
                          color: project.color
                        }}
                      >
                        <Folder className="h-3 w-3" />
                        {project.name}
                      </Badge>
                    ) : null;
                  })()}
                  
                  {activity.tagIds.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge 
                        key={tag.id}
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestart(activity)}
                  title="Restart activity"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(activity)}
                  title="Edit activity"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(activity.id)}
                  title="Delete activity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
