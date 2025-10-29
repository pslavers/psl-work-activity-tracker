import { format } from "date-fns";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string;
  name: string;
  duration: number;
  startTime: Date;
  endTime: Date;
}

interface ActivityListProps {
  activities: Activity[];
  onDelete: (id: string) => void;
}

export const ActivityList = ({ activities, onDelete }: ActivityListProps) => {
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

  const getTotalDuration = () => {
    return activities.reduce((sum, activity) => sum + activity.duration, 0);
  };

  if (activities.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No activities tracked yet</p>
          <p className="text-sm mt-1">Start your first activity to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold">Today's Activities</h2>
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{formatDuration(getTotalDuration())}</span>
        </div>
      </div>

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
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate mb-1">
                  {activity.name}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(activity.duration)}
                  </span>
                  <span>•</span>
                  <span>
                    {format(activity.startTime, "HH:mm")} - {format(activity.endTime, "HH:mm")}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(activity.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
