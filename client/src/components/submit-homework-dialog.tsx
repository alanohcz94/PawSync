import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Loader2, CheckCircle2, Upload, X, Video } from "lucide-react";
import type { HomeworkTaskWithRelations } from "@shared/schema";

const submitHomeworkSchema = z.object({
  taskId: z.string().min(1, "Please select a task"),
  note: z.string().max(1000).optional(),
});

type SubmitHomeworkFormData = z.infer<typeof submitHomeworkSchema>;

interface SubmitHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  preselectedTask?: HomeworkTaskWithRelations | null;
}

interface UploadedFile {
  file: File;
  preview: string;
  mediaType: "IMAGE" | "VIDEO";
}

export function SubmitHomeworkDialog({ open, onOpenChange, petId, preselectedTask }: SubmitHomeworkDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: tasks } = useQuery<HomeworkTaskWithRelations[]>({
    queryKey: ["/api/tasks", petId],
    enabled: open,
  });

  const activeTasks = tasks?.filter(t => t.isActive) || [];

  const form = useForm<SubmitHomeworkFormData>({
    resolver: zodResolver(submitHomeworkSchema),
    defaultValues: {
      taskId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        taskId: preselectedTask?.id || "",
        note: "",
      });
      setUploadedFiles([]);
    }
  }, [open, preselectedTask]);

  const selectedTaskId = form.watch("taskId");
  const selectedTask = activeTasks.find(t => t.id === selectedTaskId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
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

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitHomeworkFormData) => {
      setIsUploading(true);
      const mediaData: { filePath: string; mediaType: string; fileName: string }[] = [];

      for (const uploadedFile of uploadedFiles) {
        const formData = new FormData();
        formData.append("file", uploadedFile.file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const uploadResult = await uploadResponse.json();
        mediaData.push({
          filePath: uploadResult.filePath,
          mediaType: uploadedFile.mediaType,
          fileName: uploadedFile.file.name,
        });
      }

      const response = await apiRequest("POST", "/api/submissions", {
        taskId: data.taskId,
        note: data.note || null,
        media: mediaData,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", petId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", petId] });
      toast({
        title: "Homework submitted!",
        description: "Great job completing your training task.",
      });
      form.reset();
      setUploadedFiles([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit homework.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const onSubmit = (data: SubmitHomeworkFormData) => {
    submitMutation.mutate(data);
  };

  const handleClose = () => {
    if (!submitMutation.isPending) {
      form.reset();
      uploadedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
      setUploadedFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Submit Homework
          </DialogTitle>
          <DialogDescription>
            {preselectedTask
              ? `Submit your completion of "${preselectedTask.title}"`
              : "Select a task and submit your completion proof."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task">
                        <SelectValue placeholder="Select a task..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id} data-testid={`select-task-option-${task.id}`}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTask && selectedTask.media && selectedTask.media.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Trainer's demo for this task:</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedTask.media.map((media) => (
                    <div key={media.id} className="aspect-square overflow-hidden rounded-md border">
                      {media.mediaType === "IMAGE" ? (
                        <img
                          src={media.filePath}
                          alt={media.fileName || "Demo"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.filePath}
                          className="h-full w-full object-cover"
                          controls
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How did the training session go? Any observations?"
                      className="min-h-20 resize-none"
                      {...field}
                      data-testid="input-submission-note"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Attachments (Optional)</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file"
              />
              
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square overflow-hidden rounded-lg border"
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
                        onClick={() => removeFile(index)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                        data-testid={`button-remove-file-${index}`}
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
                data-testid="button-upload-media"
              >
                <Upload className="h-4 w-4" />
                Add Photos or Videos
              </Button>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={submitMutation.isPending}
                data-testid="button-cancel-submission"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={submitMutation.isPending}
                data-testid="button-submit-homework"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
