import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { PawPrint, GraduationCap, Heart, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<"TRAINER" | "OWNER" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetchUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to set role");
      }

      await refetchUser();
    } catch {
      toast({
        title: "Error",
        description: "Failed to set your role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      id: "TRAINER" as const,
      icon: GraduationCap,
      title: "I'm a Trainer",
      description: "I create training plans and assign homework tasks to pet owners.",
      features: ["Create homework tasks", "Review submissions", "Provide feedback"]
    },
    {
      id: "OWNER" as const,
      icon: Heart,
      title: "I'm a Pet Owner",
      description: "I receive training tasks from my trainer and submit completion proof.",
      features: ["View assigned tasks", "Submit completions", "Track progress"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <PawPrint className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">PawSync</span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Welcome to PawSync!</h1>
          <p className="text-muted-foreground">
            Let's get you started. How will you be using PawSync?
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedRole === role.id
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
              onClick={() => setSelectedRole(role.id)}
              data-testid={`card-role-${role.id.toLowerCase()}`}
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-8 gap-2"
          disabled={!selectedRole || isSubmitting}
          onClick={handleSubmit}
          data-testid="button-continue"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
