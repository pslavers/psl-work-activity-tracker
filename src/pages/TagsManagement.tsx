import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Activity } from "@/types/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
];

export default function TagsManagement() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(COLORS[0]);
  const [loadingData, setLoadingData] = useState(true);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (tagsError) {
        toast.error('Failed to load tags');
        console.error(tagsError);
      } else if (tagsData) {
        setTags(tagsData);
      }

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          activity_tags(tag_id)
        `)
        .order('date', { ascending: false });

      if (activitiesError) {
        toast.error('Failed to load activities');
        console.error(activitiesError);
      } else if (activitiesData) {
        const parsedActivities = activitiesData.map((a) => ({
          id: a.id,
          name: a.description,
          duration: a.duration,
          startTime: new Date(a.date),
          endTime: new Date(new Date(a.date).getTime() + a.duration),
          projectId: a.project_id || undefined,
          tagIds: a.activity_tags?.map((at: any) => at.tag_id) || [],
        }));
        setActivities(parsedActivities);
      }

      setLoadingData(false);
    };

    loadData();
  }, [user]);

  const handleCreateTag = async () => {
    if (!user || !tagName.trim()) return;

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name: tagName.trim(),
        color: tagColor,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create tag');
      console.error(error);
      return;
    }

    if (data) {
      setTags([...tags, data].sort((a, b) => a.name.localeCompare(b.name)));
      setTagName("");
      setTagColor(COLORS[0]);
      setIsCreating(false);
      toast.success('Tag created');
    }
  };

  const handleUpdateTag = async () => {
    if (!user || !editingTag || !tagName.trim()) return;

    const { error } = await supabase
      .from('tags')
      .update({
        name: tagName.trim(),
        color: tagColor,
      })
      .eq('id', editingTag.id);

    if (error) {
      toast.error('Failed to update tag');
      console.error(error);
      return;
    }

    setTags(prev => 
      prev.map(t => t.id === editingTag.id ? { ...t, name: tagName.trim(), color: tagColor } : t)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setTagName("");
    setTagColor(COLORS[0]);
    setEditingTag(null);
    toast.success('Tag updated');
  };

  const handleDeleteTag = async () => {
    if (!user || !deleteTagId) return;

    // First delete activity_tags
    await supabase
      .from('activity_tags')
      .delete()
      .eq('tag_id', deleteTagId);

    // Delete active_activity_tags
    await supabase
      .from('active_activity_tags')
      .delete()
      .eq('tag_id', deleteTagId);

    // Then delete the tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', deleteTagId);

    if (error) {
      toast.error('Failed to delete tag');
      console.error(error);
      return;
    }

    setTags(prev => prev.filter(t => t.id !== deleteTagId));
    if (selectedTagId === deleteTagId) {
      setSelectedTagId(null);
    }
    setDeleteTagId(null);
    toast.success('Tag deleted');
  };

  const startEditing = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setIsCreating(false);
    setTagName("");
    setTagColor(COLORS[0]);
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

  const filteredActivities = selectedTagId
    ? activities.filter(a => a.tagIds.includes(selectedTagId))
    : [];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Manage Tags</h1>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(isCreating || editingTag) && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <Input
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="Tag name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        editingTag ? handleUpdateTag() : handleCreateTag();
                      }
                      if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTagColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform hover:scale-110",
                          tagColor === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={editingTag ? handleUpdateTag : handleCreateTag}
                      disabled={!tagName.trim()}
                      className="flex-1"
                    >
                      {editingTag ? "Save" : "Create"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!isCreating && !editingTag && (
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Tag
                </Button>
              )}

              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedTagId === tag.id ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedTagId(tag.id)}
                  >
                    <span 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 font-medium">{tag.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(tag);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTagId(tag.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTagId
                  ? `Activities with "${tags.find(t => t.id === selectedTagId)?.name}"`
                  : "Select a tag to view activities"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTagId && filteredActivities.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No activities with this tag
                </p>
              )}
              
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium">{activity.name}</h4>
                      <Badge variant="secondary">
                        {formatDuration(activity.duration)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(activity.startTime, "PPp")}
                    </p>
                    {activity.tagIds.length > 1 && (
                      <div className="flex flex-wrap gap-1">
                        {activity.tagIds.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <Badge
                              key={tagId}
                              variant="secondary"
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                borderColor: tag.color
                              }}
                            >
                              {tag.name}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tag? This will remove it from all activities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
