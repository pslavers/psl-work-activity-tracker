import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Activity, Project, Tag } from "@/types/activity";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecentActivitiesPanelProps {
  activities: Activity[];
  projects: Project[];
  tags: Tag[];
  limit?: number;
}

export const RecentActivitiesPanel = ({
  activities,
  projects,
  tags,
  limit = 5,
}: RecentActivitiesPanelProps) => {
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

  const recentActivities = activities.slice(0, limit);

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Recent Activities
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activities yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Recent Activities
      </h3>

      <div className="space-y-3">
        {recentActivities.map((activity) => {
          const project = activity.projectId
            ? projects.find(p => p.id === activity.projectId)
            : undefined;
          const activityTags = activity.tagIds
            .map(tagId => tags.find(t => t.id === tagId))
            .filter(Boolean) as Tag[];

          return (
            <div
              key={activity.id}
              className={cn(
                "p-3 rounded-lg border border-border bg-card/50",
                "hover:bg-card transition-colors"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm truncate flex-1">
                  {activity.name}
                </h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDuration(activity.duration)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>
                  {format(activity.startTime, "HH:mm")} - {format(activity.endTime, "HH:mm")}
                </span>
              </div>

              {(project || activityTags.length > 0) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {project && (
                    <Badge
                      variant="outline"
                      className="text-xs h-5 px-1.5"
                      style={{
                        backgroundColor: `${project.color}15`,
                        borderColor: project.color,
                        color: project.color,
                      }}
                    >
                      {project.name}
                    </Badge>
                  )}
                  {activityTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs h-5 px-1.5"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activities.length > limit && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            +{activities.length - limit} more activities
          </p>
        </div>
      )}
    </Card>
  );
};
