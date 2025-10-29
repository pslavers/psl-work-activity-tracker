import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";
import { TagSelector } from "./TagSelector";
import { Project, Tag } from "@/types/activity";
import { toast } from "sonner";

interface AddActivityDialogProps {
  projects: Project[];
  tags: Tag[];
  onCreateProject: (name: string, color: string) => void;
  onEditProject?: (projectId: string, name: string, color: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onAddActivity: (activity: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    projectId?: string;
    tagIds: string[];
  }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddActivityDialog = ({
  projects,
  tags,
  onCreateProject,
  onEditProject,
  onCreateTag,
  onAddActivity,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddActivityDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activityName, setActivityName] = useState("");
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityName.trim()) {
      toast.error("Please enter an activity name");
      return;
    }

    const hours = parseInt(durationHours) || 0;
    const minutes = parseInt(durationMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = startTime.split(':').map(Number);
    
    const startDateTime = new Date(year, month - 1, day, hour, minute);
    const endDateTime = new Date(startDateTime.getTime() + totalMinutes * 60 * 1000);

    onAddActivity({
      name: activityName,
      duration: totalMinutes * 60 * 1000,
      startTime: startDateTime,
      endTime: endDateTime,
      projectId: selectedProjectId,
      tagIds: selectedTagIds,
    });

    // Reset form
    setActivityName("");
    setDurationHours("0");
    setDurationMinutes("30");
    setSelectedProjectId(undefined);
    setSelectedTagIds([]);
    setOpen(false);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Past Activity
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity Name *</Label>
            <Input
              id="activity-name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="What did you work on?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration *</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="30"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project</Label>
            <ProjectSelector
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onCreateProject={onCreateProject}
              onEditProject={onEditProject}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Activity</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};