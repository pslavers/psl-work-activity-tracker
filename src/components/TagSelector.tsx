import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag as TagIcon, Plus, X } from "lucide-react";
import { Tag } from "@/types/activity";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onEditTag?: (tagId: string, name: string, color: string) => void;
}

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
];

export const TagSelector = ({
  tags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  onEditTag,
}: TagSelectorProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName("");
      setSelectedColor(COLORS[0]);
      setIsCreating(false);
    }
  };

  const handleEdit = () => {
    if (editingTag && newTagName.trim() && onEditTag) {
      onEditTag(editingTag.id, newTagName.trim(), selectedColor);
      setNewTagName("");
      setSelectedColor(COLORS[0]);
      setEditingTag(null);
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
    setSearchQuery("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 h-auto min-h-10 py-2">
          <TagIcon className="h-4 w-4 flex-shrink-0" />
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs h-5 px-1.5"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            "Add Tags"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-2">
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-md">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="gap-1 pr-1"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                  <button
                    onClick={() => onToggleTag(tag.id)}
                    className="hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {!isCreating && !editingTag ? (
            <>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags..."
                className="h-9"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredTags.length === 0 && searchQuery ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                    No tags found
                  </div>
                ) : (
                  filteredTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        className="w-full flex items-center gap-2"
                      >
                        <button
                          onClick={() => onToggleTag(tag.id)}
                          className={cn(
                            "flex-1 text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2 text-sm",
                            isSelected && "bg-accent"
                          )}
                        >
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="truncate">{tag.name}</span>
                          {isSelected && (
                            <X className="h-4 w-4 ml-auto flex-shrink-0" />
                          )}
                        </button>
                        {onEditTag && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => startEditing(tag)}
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(true);
                  setNewTagName(searchQuery);
                  setSearchQuery("");
                }}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                {searchQuery ? `Create "${searchQuery}"` : "New Tag"}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editingTag) handleEdit();
                    else handleCreate();
                  }
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setEditingTag(null);
                  }
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
                  onClick={editingTag ? handleEdit : handleCreate}
                  disabled={!newTagName.trim()}
                  className="flex-1"
                >
                  {editingTag ? "Save" : "Create"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTag(null);
                    setNewTagName("");
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
