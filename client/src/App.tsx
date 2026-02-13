import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "@/pages/landing";
import TrainerSetup from "@/pages/trainer-setup";
import Dashboard from "@/pages/dashboard";
import AddPet from "@/pages/add-pet";
import PetDetail from "@/pages/pet-detail";
import Join from "@/pages/join";
import NotFound from "@/pages/not-found";
import { Loader2, PawPrint } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <PawPrint className="h-7 w-7 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">PawSync</span>
      </div>
      <Loader2 className="mt-8 h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AuthenticatedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/join" component={Join} />
        <Route component={Landing} />
      </Switch>
    );
  }

  if (!user.role && !user.onboardingComplete) {
    return <TrainerSetup />;
  }

  if (user.role === "TRAINER" && !user.onboardingComplete) {
    return <TrainerSetup />;
  }

  if (user.role === "OWNER" && !user.onboardingComplete) {
    return (
      <Switch>
        <Route path="/pets/new" component={AddPet} />
        <Route>
          <AddPet />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pets/new" component={AddPet} />
      <Route path="/pets/:id" component={PetDetail} />
      <Route path="/join" component={Join} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedRoutes />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
