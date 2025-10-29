import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectSelector } from "./ProjectSelector";
import { TagSelector } from "./TagSelector";
import { Activity, Project, Tag } from "@/types/activity";
import { toast } from "sonner";
import { format } from "date-fns";

interface EditActivityDialogProps {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  tags: Tag[];
  onCreateProject: (name: string, color: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onSave: (id: string, updates: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    projectId?: string;
    tagIds: string[];
  }) => void;
}

export const EditActivityDialog = ({
  activity,
  open,
  onOpenChange,
  projects,
  tags,
  onCreateProject,
  onCreateTag,
  onSave,
}: EditActivityDialogProps) => {
  const [activityName, setActivityName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (activity) {
      setActivityName(activity.name);
      setDate(format(activity.startTime, "yyyy-MM-dd"));
      setStartTime(format(activity.startTime, "HH:mm"));
      setEndTime(format(activity.endTime, "HH:mm"));
      setSelectedProjectId(activity.projectId);
      setSelectedTagIds(activity.tagIds);
    }
  }, [activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activity || !activityName.trim()) {
      toast.error("Please enter an activity name");
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

    // Handle end time on next day
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const duration = endDateTime.getTime() - startDateTime.getTime();

    if (duration <= 0) {
      toast.error("End time must be after start time");
      return;
    }

    onSave(activity.id, {
      name: activityName,
      duration,
      startTime: startDateTime,
      endTime: endDateTime,
      projectId: selectedProjectId,
      tagIds: selectedTagIds,
    });

    onOpenChange(false);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-activity-name">Activity Name *</Label>
            <Input
              id="edit-activity-name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="What did you work on?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date *</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time *</Label>
              <Input
                id="edit-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time *</Label>
              <Input
                id="edit-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project</Label>
            <ProjectSelector
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onCreateProject={onCreateProject}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelector
              tags={tags}
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTag}
              onCreateTag={onCreateTag}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};