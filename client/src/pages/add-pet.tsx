import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PawPrint, ArrowLeft, Loader2, Dog, Cat, Rabbit, Bird, Fish, HelpCircle } from "lucide-react";

const addPetSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(100),
  species: z.string().optional(),
  trainerEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

type AddPetFormData = z.infer<typeof addPetSchema>;

const speciesOptions = [
  { value: "dog", label: "Dog", icon: Dog },
  { value: "cat", label: "Cat", icon: Cat },
  { value: "rabbit", label: "Rabbit", icon: Rabbit },
  { value: "bird", label: "Bird", icon: Bird },
  { value: "fish", label: "Fish", icon: Fish },
  { value: "other", label: "Other", icon: HelpCircle },
];

export default function AddPet() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<AddPetFormData>({
    resolver: zodResolver(addPetSchema),
    defaultValues: {
      name: "",
      species: "",
      trainerEmail: "",
    },
  });

  const createPetMutation = useMutation({
    mutationFn: async (data: AddPetFormData) => {
      const response = await apiRequest("POST", "/api/pets", {
        name: data.name,
        species: data.species || null,
        trainerEmail: data.trainerEmail || null,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({
        title: "Pet added!",
        description: "Your pet has been added successfully.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add pet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddPetFormData) => {
    createPetMutation.mutate(data);
  };

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
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Add Pet</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Add a New Pet</CardTitle>
            <CardDescription>
              Enter your pet's details and optionally assign a trainer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Buddy, Luna, Max" 
                          {...field} 
                          data-testid="input-pet-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-species">
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speciesOptions.map((species) => (
                            <SelectItem 
                              key={species.value} 
                              value={species.value}
                              data-testid={`option-species-${species.value}`}
                            >
                              <div className="flex items-center gap-2">
                                <species.icon className="h-4 w-4" />
                                {species.label}
                              </div>
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
                  name="trainerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainer Email (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="trainer@example.com" 
                          {...field}
                          data-testid="input-trainer-email"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Enter your trainer's email to assign them to this pet
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/dashboard")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={createPetMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createPetMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PawPrint className="h-4 w-4" />
                        Add Pet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
