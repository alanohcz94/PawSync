import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  PawPrint, 
  ClipboardList, 
  Camera, 
  MessageCircle, 
  CheckCircle2,
  ArrowRight,
  Users
} from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function Landing() {
  const { login, isLoading } = useAuth();

  const features = [
    {
      icon: ClipboardList,
      title: "Assign Homework",
      description: "Trainers create customized training tasks with clear instructions and frequencies"
    },
    {
      icon: Camera,
      title: "Submit Proof",
      description: "Owners log completions with notes and upload photos or videos as evidence"
    },
    {
      icon: MessageCircle,
      title: "Get Feedback",
      description: "Trainers review submissions on a timeline and provide helpful comments"
    }
  ];

  const benefits = [
    "Single source of truth for all training homework",
    "Track progress with visual timeline",
    "Easy photo and video uploads",
    "Real-time feedback from trainers",
    "Mobile-friendly design for on-the-go use"
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PawSync</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              onClick={login} 
              disabled={isLoading}
              data-testid="button-login-header"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
                  <PawPrint className="h-4 w-4" />
                  Pet Training Made Simple
                </div>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Keep Pet Training{" "}
                  <span className="text-primary">On Track</span>
                </h1>
                <p className="max-w-lg text-lg text-muted-foreground">
                  PawSync is the single source of truth for pet training homework. 
                  Trainers assign tasks, owners submit proof, and everyone stays in sync.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    onClick={login}
                    disabled={isLoading}
                    className="gap-2"
                    data-testid="button-get-started"
                  >
                    <SiGoogle className="h-4 w-4" />
                    Get Started with Google
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>For trainers and pet owners</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Free to use</span>
                  </div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-center">
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl shadow-lg">
                      <img 
                        src="/images/hero-dog.png" 
                        alt="Happy dog" 
                        className="h-48 w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl shadow-lg">
                      <img 
                        src="/images/hero-cat.png" 
                        alt="Playful cat" 
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="overflow-hidden rounded-2xl shadow-lg">
                      <img 
                        src="/images/hero-bunny.png" 
                        alt="Cute bunny" 
                        className="h-32 w-full object-cover"
                      />
                    </div>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Task Completed</p>
                          <p className="text-xs text-muted-foreground">Sit command - 5 reps</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                How PawSync Works
              </h2>
              <p className="text-muted-foreground">
                A simple workflow that keeps trainers and pet owners connected
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={feature.title} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="absolute right-4 top-4 text-6xl font-bold text-muted/20">
                      {index + 1}
                    </div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                  Everything You Need to{" "}
                  <span className="text-primary">Stay Organized</span>
                </h2>
                <ul className="space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                        <ClipboardList className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Practice "Stay" command</p>
                        <p className="text-xs text-muted-foreground">Daily - 10 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                        <ClipboardList className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Leash walking practice</p>
                        <p className="text-xs text-muted-foreground">3x/week - 15 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Recall training</p>
                        <p className="text-xs text-muted-foreground">Completed today</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Join PawSync today and take your pet training to the next level.
              </p>
              <Button 
                size="lg" 
                onClick={login}
                disabled={isLoading}
                className="gap-2"
                data-testid="button-cta-bottom"
              >
                <SiGoogle className="h-4 w-4" />
                Sign Up with Google
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <PawPrint className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PawSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Keeping pet training on track, one task at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
