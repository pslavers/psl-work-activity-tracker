import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Folder, Plus, Check, Pencil } from "lucide-react";
import { Project } from "@/types/activity";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (projectId: string | undefined) => void;
  onCreateProject: (name: string, color: string) => void;
  onEditProject?: (projectId: string, name: string, color: string) => void;
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
  onEditProject,
}: ProjectSelectorProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), selectedColor);
      setNewProjectName("");
      setSelectedColor(COLORS[0]);
      setIsCreating(false);
    }
  };

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setNewProjectName(project.name);
    setSelectedColor(project.color);
    setIsCreating(false);
  };

  const handleSaveEdit = () => {
    if (editingProjectId && newProjectName.trim() && onEditProject) {
      onEditProject(editingProjectId, newProjectName.trim(), selectedColor);
      setEditingProjectId(null);
      setNewProjectName("");
      setSelectedColor(COLORS[0]);
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setNewProjectName("");
    setSelectedColor(COLORS[0]);
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
          {editingProjectId ? (
            <div className="space-y-3">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
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
                  onClick={handleSaveEdit}
                  disabled={!newProjectName.trim()}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : !isCreating ? (
            <>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="h-9"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                <button
                  onClick={() => {
                    onSelectProject(undefined);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm",
                    !selectedProjectId && "bg-accent"
                  )}
                >
                  No Project
                </button>
                {filteredProjects.length === 0 && searchQuery ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                    No projects found
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2 text-sm group",
                        selectedProjectId === project.id && "bg-accent"
                      )}
                    >
                      <button
                        onClick={() => {
                          onSelectProject(project.id);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2 flex-1 min-w-0"
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
                      {onEditProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(project);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(true);
                  setNewProjectName(searchQuery);
                  setSearchQuery("");
                }}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                {searchQuery ? `Create "${searchQuery}"` : "New Project"}
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
