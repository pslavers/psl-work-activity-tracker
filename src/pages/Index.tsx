import { useState, useEffect } from "react";
import { ActivityTimer } from "@/components/ActivityTimer";
import { ActivityList, Activity } from "@/components/ActivityList";
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
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("workActivities", JSON.stringify(activities));
  }, [activities]);

  const handleActivityComplete = (activity: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
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

        <div className="space-y-12">
          <ActivityTimer onActivityComplete={handleActivityComplete} />
          <ActivityList activities={activities} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
};

export default Index;
