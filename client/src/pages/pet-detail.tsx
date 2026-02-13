import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  PawPrint,
  ArrowLeft,
  Plus,
  ClipboardList,
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  User,
  Dog,
  Cat,
  Rabbit,
  Image,
  Video,
  Loader2,
  Send,
  Pencil,
  Play,
  Archive,
  ArchiveRestore,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import type {
  PetWithRelations,
  HomeworkTaskWithRelations,
  HomeworkSubmissionWithRelations,
  TimelineItem,
} from "@shared/schema";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { SubmitHomeworkDialog } from "@/components/submit-homework-dialog";
import { SubmissionDetailDialog } from "@/components/submission-detail-dialog";
import { AssignTrainerDialog } from "@/components/assign-trainer-dialog";
import { EditPetDialog } from "@/components/edit-pet-dialog";
import {
  format,
  isThisWeek,
  startOfWeek,
  endOfWeek,
  formatDistanceToNow,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";

const speciesIcons: Record<string, typeof Dog> = {
  dog: Dog,
  cat: Cat,
  rabbit: Rabbit,
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function PreferredDaysSelector({
  task,
  isOwner,
}: {
  task: HomeworkTaskWithRelations;
  isOwner: boolean;
}) {
  const { toast } = useToast();
  const selectedDays = task.preferredDays || [];

  const mutation = useMutation({
    mutationFn: async (days: string[]) => {
      return apiRequest("PATCH", `/api/tasks/${task.id}/preferred-days`, {
        preferredDays: days.length > 0 ? days : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.petId] });
      toast({ title: "Preferred days updated!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleDay = (day: string) => {
    const current = [...selectedDays];
    const idx = current.indexOf(day);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(day);
    }
    mutation.mutate(current);
  };

  if (!isOwner && selectedDays.length === 0) return null;

  if (!isOwner) {
    return (
      <div
        className="flex flex-wrap items-center gap-1 mt-2"
        data-testid={`preferred-days-display-${task.id}`}
      >
        <CalendarDays className="h-3 w-3 text-muted-foreground mr-1" />
        {selectedDays.map((day) => (
          <Badge key={day} variant="outline" className="text-xs px-1.5">
            {day}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2" data-testid={`preferred-days-selector-${task.id}`}>
      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        Preferred days
      </p>
      <div className="flex flex-wrap gap-1">
        {ALL_DAYS.map((day) => {
          const isSelected = selectedDays.includes(day);
          return (
            <Button
              key={day}
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className={`text-xs h-7 px-2 min-h-0 toggle-elevate ${isSelected ? "toggle-elevated" : ""}`}
              onClick={() => toggleDay(day)}
              disabled={mutation.isPending}
              data-testid={`button-day-${day.toLowerCase()}-${task.id}`}
            >
              {day}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isOwner,
  isTrainer,
  onSubmit,
  onEdit,
  onArchive,
}: {
  task: HomeworkTaskWithRelations;
  isOwner: boolean;
  isTrainer: boolean;
  onSubmit: (task: HomeworkTaskWithRelations) => void;
  onEdit: (task: HomeworkTaskWithRelations) => void;
  onArchive: (task: HomeworkTaskWithRelations) => void;
}) {
  const [showMedia, setShowMedia] = useState(false);
  const hasMedia = task.media && task.media.length > 0;
  const isClosed = !task.isActive;

  return (
    <Card
      data-testid={`card-task-${task.id}`}
      className={isClosed ? "opacity-60" : ""}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList
                className={`h-4 w-4 ${isClosed ? "text-muted-foreground" : "text-primary"}`}
              />
              <h3
                className={`font-semibold ${isClosed ? "text-muted-foreground line-through" : ""}`}
              >
                {task.title}
              </h3>
              {isClosed && (
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  Closed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{task.instructions}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {task.frequency}
              </Badge>
              {task.expectedDurationMins && (
                <Badge variant="outline">{task.expectedDurationMins} min</Badge>
              )}
              {hasMedia && (
                <Badge
                  variant="outline"
                  className="cursor-pointer hover-elevate"
                  onClick={() => setShowMedia(!showMedia)}
                  data-testid={`badge-demo-media-${task.id}`}
                >
                  <Play className="mr-1 h-3 w-3" />
                  {task.media!.length} demo{" "}
                  {task.media!.length === 1 ? "file" : "files"}
                </Badge>
              )}
            </div>
            {!isClosed && (
              <PreferredDaysSelector task={task} isOwner={isOwner} />
            )}
          </div>
          <div className="flex items-center gap-1">
            {isTrainer && !isClosed && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(task)}
                data-testid={`button-edit-task-${task.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {isTrainer && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onArchive(task)}
                data-testid={`button-archive-task-${task.id}`}
              >
                {isClosed ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
            )}
            {isOwner && !isClosed && (
              <Button
                size="sm"
                onClick={() => onSubmit(task)}
                data-testid={`button-submit-task-${task.id}`}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Done
              </Button>
            )}
          </div>
        </div>
        {showMedia && hasMedia && (
          <div
            className="mt-3 grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-2"
            data-testid={`demo-media-grid-${task.id}`}
          >
            {task.media!.map((media) => (
              <div
                key={media.id}
                className="aspect-square overflow-hidden rounded-md border"
              >
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
        )}
      </CardContent>
    </Card>
  );
}

function ProgressView({
  tasks,
  submissions,
  isTrainer,
  onViewSubmission,
}: {
  tasks: HomeworkTaskWithRelations[];
  submissions: HomeworkSubmissionWithRelations[];
  isTrainer: boolean;
  onViewSubmission: (submission: HomeworkSubmissionWithRelations) => void;
}) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const submissionsByTask = tasks.map((task) => ({
    task,
    submissions: submissions
      .filter((s) => s.taskId === task.id)
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      ),
  }));

  if (submissionsByTask.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Tasks Yet</h3>
          <p className="text-center text-muted-foreground">
            Tasks and their submissions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="progress-view">
      {submissionsByTask.map(({ task, submissions: taskSubs }) => {
        const isExpanded = expandedTasks.has(task.id);
        const isClosed = !task.isActive;

        return (
          <Card
            key={task.id}
            className={isClosed ? "opacity-60" : ""}
            data-testid={`progress-task-${task.id}`}
          >
            <button
              className="w-full text-left p-4 flex items-center justify-between gap-3"
              onClick={() => toggleTask(task.id)}
              data-testid={`button-expand-task-${task.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isClosed ? "bg-muted" : "bg-primary/10"}`}
                >
                  <ClipboardList
                    className={`h-4 w-4 ${isClosed ? "text-muted-foreground" : "text-primary"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-semibold truncate ${isClosed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {taskSubs.length} submission
                      {taskSubs.length !== 1 ? "s" : ""}
                    </span>
                    {task.preferredDays && task.preferredDays.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{task.preferredDays.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {taskSubs.length}
                </Badge>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t px-4 pb-4">
                {taskSubs.length > 0 ? (
                  <div className="space-y-3 pt-3">
                    {taskSubs.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="flex gap-3 cursor-pointer rounded-md p-2 hover-elevate"
                        onClick={() => onViewSubmission(sub)}
                        data-testid={`progress-submission-${sub.id}`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10 text-xs font-medium text-green-600">
                            {idx + 1}
                          </div>
                          {idx < taskSubs.length - 1 && (
                            <div className="flex-1 w-px bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {format(new Date(sub.submittedAt), "MMM d, yyyy")}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(sub.submittedAt), "h:mm a")}
                            </span>
                          </div>
                          {sub.note && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {sub.note}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {sub.media && sub.media.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {sub.media.some(
                                  (m) => m.mediaType === "VIDEO",
                                ) ? (
                                  <Video className="mr-1 h-3 w-3" />
                                ) : (
                                  <Image className="mr-1 h-3 w-3" />
                                )}
                                {sub.media.length}
                              </Badge>
                            )}
                            {sub.comments && sub.comments.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <MessageCircle className="mr-1 h-3 w-3" />
                                {sub.comments.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-3">
                    No submissions yet for this task.
                  </p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function CalendarView({
  tasks,
  submissions,
  isOwner,
  onSubmitTask,
}: {
  tasks: HomeworkTaskWithRelations[];
  submissions: HomeworkSubmissionWithRelations[];
  isOwner: boolean;
  onSubmitTask: (task: HomeworkTaskWithRelations) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = getDay(monthStart);

  const getSubmissionsForDay = (day: Date) => {
    return submissions.filter((sub) =>
      isSameDay(new Date(sub.submittedAt), day),
    );
  };

  const dayNameToNumber: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const getTasksForDay = (day: Date) => {
    const dayOfWeek = getDay(day);
    return tasks.filter((task) => {
      if (task.preferredDays && task.preferredDays.length > 0) {
        return task.preferredDays.some((d) => dayNameToNumber[d] === dayOfWeek);
      }
      const freq = task.frequency?.toLowerCase() || "";
      if (freq === "daily") return true;
      if (freq === "3x/week" || freq === "3x per week") {
        return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      }
      if (freq === "2x/week" || freq === "2x per week") {
        return dayOfWeek === 2 || dayOfWeek === 5;
      }
      if (freq === "weekly") {
        return dayOfWeek === 1;
      }
      return true;
    });
  };

  const getDayStatus = (day: Date) => {
    const tasksForDay = getTasksForDay(day);
    const subsForDay = getSubmissionsForDay(day);

    if (tasksForDay.length === 0) return "none";
    if (day > new Date()) return "future";
    const completedTaskCount = tasksForDay.filter((task) =>
      subsForDay.some((sub) => sub.taskId === task.id),
    ).length;
    if (completedTaskCount >= tasksForDay.length) return "complete";
    if (completedTaskCount > 0) return "partial";
    return "missed";
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const status = getDayStatus(day);
            const tasksForDay = getTasksForDay(day);
            const subsForDay = getSubmissionsForDay(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`
                  aspect-square rounded-md flex flex-col items-center justify-center text-sm relative
                  transition-colors
                  ${isToday(day) ? "ring-2 ring-primary ring-offset-1" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                  ${!isSameMonth(day, currentMonth) ? "text-muted-foreground" : ""}
                `}
              >
                <span>{format(day, "d")}</span>
                {tasksForDay.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {status === "complete" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    {status === "partial" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    )}
                    {status === "missed" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    {status === "future" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Complete</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Missed</span>
          </div>
        </div>

        {selectedDay && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-3">
              {format(selectedDay, "EEEE, MMMM d")}
            </h4>

            {getTasksForDay(selectedDay).length > 0 ? (
              <div className="space-y-2">
                {getTasksForDay(selectedDay).map((task) => {
                  const wasCompleted = getSubmissionsForDay(selectedDay).some(
                    (sub) => sub.taskId === task.id,
                  );

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        {wasCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className={
                            wasCompleted
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          {task.title}
                        </span>
                      </div>
                      {isOwner && !wasCompleted && isToday(selectedDay) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onSubmitTask(task)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Done
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tasks scheduled for this day.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineItemCard({
  item,
  isTrainer,
  onViewSubmission,
  petId,
}: {
  item: TimelineItem;
  isTrainer: boolean;
  onViewSubmission: (submission: HomeworkSubmissionWithRelations) => void;
  petId: string;
}) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const { toast } = useToast();

  const commentMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const formData = new FormData();
      formData.append("comment", commentText);
      const response = await fetch(`/api/submissions/${submissionId}/comment`, {
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
      toast({
        title: "Comment added!",
        description: "Your feedback has been sent.",
      });
      setCommentText("");
      setIsCommenting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment.",
        variant: "destructive",
      });
    },
  });

  if (item.type === "task") {
    const task = item.data as HomeworkTaskWithRelations;
    return (
      <div className="flex gap-4" data-testid={`timeline-task-${task.id}`}>
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 w-px bg-border" />
        </div>
        <div className="flex-1 pb-6">
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.date), "MMM d, h:mm a")}
          </p>
          <p className="font-medium">New task assigned</p>
          <p className="text-sm text-muted-foreground">{task.title}</p>
        </div>
      </div>
    );
  }

  if (item.type === "submission") {
    const submission = item.data as HomeworkSubmissionWithRelations;
    const hasMedia = submission.media && submission.media.length > 0;
    return (
      <div
        className="flex gap-4"
        data-testid={`timeline-submission-${submission.id}`}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex-1 w-px bg-border" />
        </div>
        <Card className="flex-1 mb-6">
          <CardContent className="p-4">
            <div
              className="cursor-pointer"
              onClick={() => onViewSubmission(submission)}
            >
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.date), "MMM d, h:mm a")}
              </p>
              <p className="font-medium">Task completed</p>
              <p className="text-sm text-muted-foreground">
                {submission.task?.title}
              </p>
              {submission.note && (
                <p className="mt-2 text-sm italic">"{submission.note}"</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                {hasMedia && (
                  <Badge variant="secondary">
                    {submission.media?.some((m) => m.mediaType === "VIDEO") ? (
                      <Video className="mr-1 h-3 w-3" />
                    ) : (
                      <Image className="mr-1 h-3 w-3" />
                    )}
                    {submission.media?.length} attachment
                    {submission.media?.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                {submission.comments && submission.comments.length > 0 && (
                  <Badge variant="outline">
                    <MessageCircle className="mr-1 h-3 w-3" />
                    {submission.comments.length} comment
                    {submission.comments.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            {/* Existing comments */}
            {submission.comments && submission.comments.length > 0 && (
              <div className="mt-3 border-t pt-3 space-y-2">
                {submission.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {comment.trainer?.firstName || "Trainer"}:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {comment.comment}
                        </span>
                      </div>
                      {comment.media && comment.media.length > 0 && (
                        <div className="flex gap-2">
                          {comment.media.map((media: any) => (
                            <div
                              key={media.id}
                              className="h-16 w-16 overflow-hidden rounded-md border cursor-pointer hover-elevate"
                              onClick={() => onViewSubmission(submission)}
                            >
                              {media.mediaType === "IMAGE" ? (
                                <img
                                  src={media.filePath}
                                  alt={media.fileName || "Attachment"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                  <Video className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline comment input for trainers */}
            {isTrainer && (
              <div className="mt-3 border-t pt-3">
                {isCommenting ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add your feedback..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && commentText.trim()) {
                          commentMutation.mutate(submission.id);
                        }
                      }}
                      data-testid={`input-inline-comment-${submission.id}`}
                    />
                    <Button
                      size="icon"
                      disabled={
                        !commentText.trim() || commentMutation.isPending
                      }
                      onClick={() => commentMutation.mutate(submission.id)}
                      data-testid={`button-send-inline-comment-${submission.id}`}
                    >
                      {commentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsCommenting(false);
                        setCommentText("");
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setIsCommenting(true)}
                    data-testid={`button-add-comment-${submission.id}`}
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Add Feedback
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (item.type === "comment") {
    const comment = item.data as any;
    return (
      <div
        className="flex gap-4"
        data-testid={`timeline-comment-${comment.id}`}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1 w-px bg-border" />
        </div>
        <div className="flex-1 pb-6 space-y-1">
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.date), "MMM d, h:mm a")}
          </p>
          <p className="font-medium">Trainer feedback</p>
          <p className="text-sm text-muted-foreground">"{comment.comment}"</p>
          {comment.media && comment.media.length > 0 && (
            <div className="flex gap-2 pt-1">
              {comment.media.map((media: any) => (
                <a
                  key={media.id}
                  href={media.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-md border cursor-pointer hover-elevate"
                >
                  {media.mediaType === "IMAGE" ? (
                    <img
                      src={media.filePath}
                      alt={media.fileName || "Attachment"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function PetDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTask, setEditTask] = useState<HomeworkTaskWithRelations | null>(
    null,
  );
  const [submitHomeworkOpen, setSubmitHomeworkOpen] = useState(false);
  const [submissionDetailOpen, setSubmissionDetailOpen] = useState(false);
  const [assignTrainerOpen, setAssignTrainerOpen] = useState(false);
  const [editPetOpen, setEditPetOpen] = useState(false);
  const [selectedTask, setSelectedTask] =
    useState<HomeworkTaskWithRelations | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<HomeworkSubmissionWithRelations | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const isTrainer = user?.role === "TRAINER" || isAdmin;
  const isOwner = user?.role === "OWNER" || isAdmin;

  const { data: pet, isLoading: petLoading } = useQuery<PetWithRelations>({
    queryKey: ["/api/pets", params.id],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<
    HomeworkTaskWithRelations[]
  >({
    queryKey: ["/api/tasks", params.id],
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery<
    TimelineItem[]
  >({
    queryKey: ["/api/timeline", params.id],
  });

  const archiveMutation = useMutation({
    mutationFn: async ({
      taskId,
      isActive,
    }: {
      taskId: string;
      isActive: boolean;
    }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        isActive,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", params.id] });
      toast({
        title: variables.isActive ? "Task reopened!" : "Task closed!",
        description: variables.isActive
          ? "The task is now active again."
          : "The task has been archived.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task.",
        variant: "destructive",
      });
    },
  });

  const SpeciesIcon =
    speciesIcons[pet?.species?.toLowerCase() || ""] || PawPrint;
  const activeTasks = tasks?.filter((t) => t.isActive) || [];
  const closedTasks = tasks?.filter((t) => !t.isActive) || [];

  const handleSubmitTask = (task: HomeworkTaskWithRelations) => {
    setSelectedTask(task);
    setSubmitHomeworkOpen(true);
  };

  const handleEditTask = (task: HomeworkTaskWithRelations) => {
    setEditTask(task);
    setCreateTaskOpen(true);
  };

  const handleArchiveTask = (task: HomeworkTaskWithRelations) => {
    archiveMutation.mutate({ taskId: task.id, isActive: !task.isActive });
  };

  const handleViewSubmission = (
    submission: HomeworkSubmissionWithRelations,
  ) => {
    setSelectedSubmission(submission);
    setSubmissionDetailOpen(true);
  };

  const groupedTimeline = timeline?.reduce(
    (groups, item) => {
      const date = new Date(item.date);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      let groupKey: string;

      if (isThisWeek(date, { weekStartsOn: 1 })) {
        groupKey = `This Week (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`;
      } else {
        groupKey = `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, TimelineItem[]>,
  );

  if (petLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center gap-4 px-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center gap-4 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PawPrint className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Pet not found</h3>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <SpeciesIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{pet.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {pet.imageUrl ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={pet.imageUrl} alt={pet.name} />
                    <AvatarFallback>
                      <SpeciesIcon className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <SpeciesIcon className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{pet.name}</h2>
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditPetOpen(true)}
                        data-testid="button-edit-pet"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {pet.species && (
                      <span className="capitalize">{pet.species}</span>
                    )}
                    {pet.breed && <span>{pet.breed}</span>}
                    {pet.age && <span>{pet.age}</span>}
                  </div>
                  {pet.ownerPhone && (
                    <p
                      className="text-xs text-muted-foreground mt-1"
                      data-testid="text-owner-phone"
                    >
                      Phone: {pet.ownerPhone}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pet.trainer ? (
                      <Badge variant="secondary">
                        <User className="mr-1 h-3 w-3" />
                        Trainer:{" "}
                        {pet.trainer.firstName
                          ? `${pet.trainer.firstName} ${pet.trainer.lastName || ""}`.trim()
                          : pet.trainer.email}
                      </Badge>
                    ) : isOwner ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignTrainerOpen(true)}
                        data-testid="button-assign-trainer"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Assign Trainer
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        No trainer assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isTrainer && (
                  <Button
                    className="gap-2"
                    onClick={() => setCreateTaskOpen(true)}
                    data-testid="button-create-task"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              <ClipboardList className="mr-1 h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">
              <BarChart3 className="mr-1 h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">
              <CalendarDays className="mr-1 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timeline" data-testid="tab-timeline">
              <Clock className="mr-1 h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            {tasksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : activeTasks.length > 0 || closedTasks.length > 0 ? (
              <>
                {activeTasks.length > 0 ? (
                  activeTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOwner={isOwner}
                      isTrainer={isTrainer}
                      onSubmit={handleSubmitTask}
                      onEdit={handleEditTask}
                      onArchive={handleArchiveTask}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">No Active Tasks</h3>
                      <p className="text-center text-muted-foreground">
                        {isTrainer
                          ? "Create a training task to get started."
                          : "Your trainer hasn't assigned any tasks yet."}
                      </p>
                      {isTrainer && (
                        <Button
                          className="mt-4 gap-2"
                          onClick={() => setCreateTaskOpen(true)}
                          data-testid="button-create-first-task"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Task
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
                {closedTasks.length > 0 && (
                  <div className="space-y-4" data-testid="section-closed-tasks">
                    <div className="flex items-center gap-2 pt-2">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Closed Tasks ({closedTasks.length})
                      </h3>
                    </div>
                    {closedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isOwner={isOwner}
                        isTrainer={isTrainer}
                        onSubmit={handleSubmitTask}
                        onEdit={handleEditTask}
                        onArchive={handleArchiveTask}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Active Tasks</h3>
                  <p className="text-center text-muted-foreground">
                    {isTrainer
                      ? "Create a training task to get started."
                      : "Your trainer hasn't assigned any tasks yet."}
                  </p>
                  {isTrainer && (
                    <Button
                      className="mt-4 gap-2"
                      onClick={() => setCreateTaskOpen(true)}
                      data-testid="button-create-first-task"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {tasksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <ProgressView
                tasks={tasks || []}
                submissions={
                  timeline
                    ?.filter((t) => t.type === "submission")
                    .map((t) => t.data as HomeworkSubmissionWithRelations) || []
                }
                isTrainer={isTrainer}
                onViewSubmission={handleViewSubmission}
              />
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarView
              tasks={activeTasks}
              submissions={
                timeline
                  ?.filter((t) => t.type === "submission")
                  .map((t) => t.data as HomeworkSubmissionWithRelations) || []
              }
              isOwner={isOwner}
              onSubmitTask={handleSubmitTask}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            {timelineLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : timeline && timeline.length > 0 ? (
              Object.entries(groupedTimeline || {}).map(([group, items]) => (
                <div key={group}>
                  <h3 className="mb-4 font-semibold text-muted-foreground">
                    {group}
                  </h3>
                  <div>
                    {items.map((item, index) => (
                      <TimelineItemCard
                        key={`${item.type}-${(item.data as any).id}-${index}`}
                        item={item}
                        isTrainer={isTrainer}
                        onViewSubmission={handleViewSubmission}
                        petId={pet.id}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Activity Yet</h3>
                  <p className="text-center text-muted-foreground">
                    Activity will appear here as tasks are assigned and
                    completed.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={(open) => {
          setCreateTaskOpen(open);
          if (!open) setEditTask(null);
        }}
        petId={pet.id}
        editTask={editTask}
      />

      <SubmitHomeworkDialog
        open={submitHomeworkOpen}
        onOpenChange={setSubmitHomeworkOpen}
        petId={pet.id}
        preselectedTask={selectedTask}
      />

      <SubmissionDetailDialog
        open={submissionDetailOpen}
        onOpenChange={setSubmissionDetailOpen}
        submission={selectedSubmission}
        isTrainer={isTrainer}
        petId={pet.id}
      />

      <AssignTrainerDialog
        open={assignTrainerOpen}
        onOpenChange={setAssignTrainerOpen}
        petId={pet.id}
      />

      <EditPetDialog
        open={editPetOpen}
        onOpenChange={setEditPetOpen}
        pet={pet}
      />
    </div>
  );
}
