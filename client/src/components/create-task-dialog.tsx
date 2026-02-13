import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ClipboardList, Upload, X, Image, Video, Pencil } from "lucide-react";
import type { HomeworkTaskWithRelations, TaskMedia } from "@shared/schema";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  instructions: z.string().min(1, "Instructions are required").max(2000),
  frequency: z.string().min(1, "Frequency is required"),
  expectedDurationMins: z.coerce.number().min(1).max(240).optional().or(z.literal("")),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  editTask?: HomeworkTaskWithRelations | null;
}

interface PendingUpload {
  file: File;
  preview: string;
  mediaType: "IMAGE" | "VIDEO";
}

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "2x/day", label: "Twice a day" },
  { value: "3x/week", label: "3 times per week" },
  { value: "weekly", label: "Weekly" },
  { value: "as-needed", label: "As needed" },
];

export function CreateTaskDialog({ open, onOpenChange, petId, editTask }: CreateTaskDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [existingMedia, setExistingMedia] = useState<TaskMedia[]>([]);
  const isEditing = !!editTask;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      instructions: "",
      frequency: "",
      expectedDurationMins: "",
    },
  });

  useEffect(() => {
    if (open && editTask) {
      form.reset({
        title: editTask.title,
        instructions: editTask.instructions,
        frequency: editTask.frequency,
        expectedDurationMins: editTask.expectedDurationMins || "",
      });
      setExistingMedia(editTask.media || []);
    } else if (open && !editTask) {
      form.reset({
        title: "",
        instructions: "",
        frequency: "",
        expectedDurationMins: "",
      });
      setExistingMedia([]);
    }
    if (!open) {
      setPendingUploads([]);
    }
  }, [open, editTask]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: PendingUpload[] = [];
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        toast({
          title: "Invalid file type",
          description: "Please upload images or videos only.",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Files must be under 50MB.",
          variant: "destructive",
        });
        continue;
      }

      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        mediaType: isVideo ? "VIDEO" : "IMAGE",
      });
    }

    setPendingUploads((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingUploads((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const deleteExistingMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      if (!editTask) return;
      await apiRequest("DELETE", `/api/tasks/${editTask.id}/media/${mediaId}`);
    },
    onSuccess: (_, mediaId) => {
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove media.",
        variant: "destructive",
      });
    },
  });

  const taskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      let taskId: string;

      if (isEditing && editTask) {
        const response = await apiRequest("PATCH", `/api/tasks/${editTask.id}`, {
          title: data.title,
          instructions: data.instructions,
          frequency: data.frequency,
          expectedDurationMins: data.expectedDurationMins ? Number(data.expectedDurationMins) : null,
        });
        taskId = editTask.id;
      } else {
        const response = await apiRequest("POST", "/api/tasks", {
          petId,
          title: data.title,
          instructions: data.instructions,
          frequency: data.frequency,
          expectedDurationMins: data.expectedDurationMins ? Number(data.expectedDurationMins) : null,
        });
        const result = await response.json();
        taskId = result.id;
      }

      for (const pendingFile of pendingUploads) {
        const formData = new FormData();
        formData.append("file", pendingFile.file);

        const uploadResponse = await fetch(`/api/tasks/${taskId}/media`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload demonstration media");
        }
      }

      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", petId] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", petId] });
      toast({
        title: isEditing ? "Task updated!" : "Task created!",
        description: isEditing
          ? "The homework task has been updated."
          : "The homework task has been assigned.",
      });
      form.reset();
      setPendingUploads([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} task.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    taskMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Pencil className="h-5 w-5 text-primary" />
            ) : (
              <ClipboardList className="h-5 w-5 text-primary" />
            )}
            {isEditing ? "Edit Training Task" : "Create Training Task"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the task details. Changes will be visible to the owner immediately."
              : "Assign a new homework task for this pet."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Practice 'Sit' command" 
                      {...field}
                      data-testid="input-task-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe how to perform this training exercise..."
                      className="min-h-24 resize-none"
                      {...field}
                      data-testid="input-task-instructions"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue placeholder="How often?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDurationMins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 10"
                        min={1}
                        max={240}
                        {...field}
                        data-testid="input-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Demonstration Media (Optional)</FormLabel>
              <p className="text-xs text-muted-foreground">
                Upload photos or videos to show how to perform this exercise.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-task-media"
              />

              {(existingMedia.length > 0 || pendingUploads.length > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {existingMedia.map((media) => (
                    <div
                      key={media.id}
                      className="relative aspect-square overflow-hidden rounded-lg border"
                    >
                      {media.mediaType === "IMAGE" ? (
                        <img
                          src={media.filePath}
                          alt={media.fileName || "Demo"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteExistingMediaMutation.mutate(media.id)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                        data-testid={`button-remove-existing-media-${media.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {pendingUploads.map((file, index) => (
                    <div
                      key={`pending-${index}`}
                      className="relative aspect-square overflow-hidden rounded-lg border border-dashed"
                    >
                      {file.mediaType === "IMAGE" ? (
                        <img
                          src={file.preview}
                          alt={`Upload ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                        data-testid={`button-remove-pending-media-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-demo-media"
              >
                <Upload className="h-4 w-4" />
                Add Demo Photos or Videos
              </Button>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={taskMutation.isPending}
                data-testid={isEditing ? "button-update-task" : "button-create-task"}
              >
                {taskMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Task"
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
