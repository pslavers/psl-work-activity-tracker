import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Folder, Plus, Check } from "lucide-react";
import { Project } from "@/types/activity";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (projectId: string | undefined) => void;
  onCreateProject: (name: string, color: string) => void;
}

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
];

export const ProjectSelector = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}: ProjectSelectorProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), selectedColor);
      setNewProjectName("");
      setSelectedColor(COLORS[0]);
      setIsCreating(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Folder className="h-4 w-4" />
          {selectedProject ? (
            <>
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: selectedProject.color }}
              />
              {selectedProject.name}
            </>
          ) : (
            "No Project"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-2">
          {!isCreating ? (
            <>
              <div className="max-h-48 overflow-y-auto space-y-1">
                <button
                  onClick={() => onSelectProject(undefined)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm",
                    !selectedProjectId && "bg-accent"
                  )}
                >
                  No Project
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2 text-sm",
                      selectedProjectId === project.id && "bg-accent"
                    )}
                  >
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                    {selectedProjectId === project.id && (
                      <Check className="h-4 w-4 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setIsCreating(false);
                }}
                autoFocus
              />
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform hover:scale-110",
                      selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newProjectName.trim()}
                  className="flex-1"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
