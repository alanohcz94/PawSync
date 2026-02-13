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
import { Loader2, UserPlus } from "lucide-react";

const assignTrainerSchema = z.object({
  trainerEmail: z.string().email("Please enter a valid email address"),
});

type AssignTrainerFormData = z.infer<typeof assignTrainerSchema>;

interface AssignTrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
}

export function AssignTrainerDialog({ open, onOpenChange, petId }: AssignTrainerDialogProps) {
  const { toast } = useToast();

  const form = useForm<AssignTrainerFormData>({
    resolver: zodResolver(assignTrainerSchema),
    defaultValues: {
      trainerEmail: "",
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: AssignTrainerFormData) => {
      const response = await apiRequest("POST", `/api/pets/${petId}/trainer`, {
        trainerEmail: data.trainerEmail,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId] });
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({
        title: "Trainer assigned!",
        description: "The trainer has been assigned to your pet.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign trainer. Make sure the email belongs to a registered trainer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignTrainerFormData) => {
    assignMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Assign Trainer
          </DialogTitle>
          <DialogDescription>
            Enter your trainer's email address to assign them to your pet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="trainerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="trainer@example.com" 
                      {...field}
                      data-testid="input-assign-trainer-email"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    The trainer must have a PawSync account with the Trainer role.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-assign"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={assignMutation.isPending}
                data-testid="button-assign-trainer"
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Assign
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
