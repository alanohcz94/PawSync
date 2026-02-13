import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle2, MessageCircle, Image, Video, Send, User, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import type { HomeworkSubmissionWithRelations } from "@shared/schema";

const commentSchema = z.object({
  comment: z.string().min(1, "Comment is required").max(1000),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: HomeworkSubmissionWithRelations | null;
  isTrainer: boolean;
  petId: string;
}

export function SubmissionDetailDialog({ 
  open, 
  onOpenChange, 
  submission, 
  isTrainer,
  petId 
}: SubmissionDetailDialogProps) {
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: "",
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      if (!submission) throw new Error("No submission selected");
      
      const formData = new FormData();
      formData.append("comment", data.comment);
      if (attachedFile) {
        formData.append("file", attachedFile);
      }
      
      const response = await fetch(`/api/submissions/${submission.id}/comment`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", petId] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Comment added!",
        description: "Your feedback has been sent.",
      });
      form.reset();
      setAttachedFile(null);
      setFilePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommentFormData) => {
    commentMutation.mutate(data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
    if (e.target) e.target.value = "";
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  if (!submission) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Submission Details
            </DialogTitle>
            <DialogDescription>
              {submission.task?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={submission.submittedBy?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {submission.submittedBy?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{submission.submittedBy?.firstName ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName || ''}`.trim() : "Pet Owner"}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {submission.note && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm italic">"{submission.note}"</p>
                </CardContent>
              </Card>
            )}

            {submission.media && submission.media.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                <div className="grid grid-cols-3 gap-2">
                  {submission.media.map((media) => (
                    <div 
                      key={media.id}
                      className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border hover-elevate"
                      onClick={() => setSelectedMedia(media.filePath)}
                      data-testid={`media-${media.id}`}
                    >
                      {media.mediaType === "IMAGE" ? (
                        <img
                          src={media.filePath}
                          alt={media.fileName || "Submission photo"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Trainer Feedback</p>
              </div>

              {submission.comments && submission.comments.length > 0 ? (
                <div className="space-y-3">
                  {submission.comments.map((comment) => (
                    <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.trainer?.profileImageUrl || undefined} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                {comment.trainer?.firstName ? `${comment.trainer.firstName} ${comment.trainer.lastName || ''}`.trim() : "Trainer"}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                Trainer
                              </Badge>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                            {comment.media && comment.media.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {comment.media.map((media) => (
                                  <div 
                                    key={media.id}
                                    className="relative aspect-video cursor-pointer overflow-hidden rounded-md border hover-elevate"
                                    onClick={() => setSelectedMedia(media.filePath)}
                                    data-testid={`comment-media-${media.id}`}
                                  >
                                    {media.mediaType === "IMAGE" ? (
                                      <img
                                        src={media.filePath}
                                        alt={media.fileName || "Feedback attachment"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-muted">
                                        <Video className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isTrainer ? "Add your feedback below." : "No feedback yet."}
                </p>
              )}

              {isTrainer && (
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(onSubmit)} 
                    className="space-y-2"
                  >
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Add your feedback..."
                              className="min-h-10 resize-none"
                              {...field}
                              data-testid="input-comment"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {attachedFile && (
                      <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="flex-1 truncate text-xs text-muted-foreground">{attachedFile.name}</span>
                        <Button type="button" size="icon" variant="ghost" onClick={removeAttachment} data-testid="button-remove-attachment">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        data-testid="input-comment-file"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-attach-file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1" />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={commentMutation.isPending}
                        data-testid="button-send-comment"
                      >
                        {commentMutation.isPending ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-1 h-4 w-4" />
                        )}
                        Send
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl p-0">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          <DialogDescription className="sr-only">Full size media preview</DialogDescription>
          {selectedMedia && (
            /\.(mp4|webm|mov|quicktime)$/i.test(selectedMedia) || selectedMedia.includes("video") ? (
              <video
                src={selectedMedia}
                controls
                className="w-full rounded-lg"
              />
            ) : (
              <img
                src={selectedMedia}
                alt="Full size media"
                className="w-full rounded-lg object-contain"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
