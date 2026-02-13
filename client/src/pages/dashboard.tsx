import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  PawPrint,
  Plus,
  LogOut,
  ChevronRight,
  Dog,
  Cat,
  Rabbit,
  ClipboardList,
  User,
  Copy,
  Check,
  QrCode,
  LinkIcon
} from "lucide-react";
import type { PetWithRelations } from "@shared/schema";

const speciesIcons: Record<string, typeof Dog> = {
  dog: Dog,
  cat: Cat,
  rabbit: Rabbit,
};

function PetCard({ pet, userRole }: { pet: PetWithRelations; userRole: string }) {
  const [, navigate] = useLocation();
  const SpeciesIcon = speciesIcons[pet.species?.toLowerCase() || ""] || PawPrint;
  const showOwner = userRole === "TRAINER" || userRole === "ADMIN";
  const showTrainer = userRole === "OWNER" || userRole === "ADMIN";

  return (
    <Card 
      className="cursor-pointer transition-all hover-elevate"
      onClick={() => navigate(`/pets/${pet.id}`)}
      data-testid={`card-pet-${pet.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {pet.imageUrl ? (
              <Avatar className="h-14 w-14">
                <AvatarImage src={pet.imageUrl} alt={pet.name} />
                <AvatarFallback>
                  <SpeciesIcon className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <SpeciesIcon className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{pet.name}</h3>
            {pet.species && (
              <p className="text-sm text-muted-foreground capitalize">{pet.species}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {showOwner && pet.owner && (
                <Badge variant="secondary" className="text-xs" data-testid={`badge-owner-${pet.id}`}>
                  <User className="mr-1 h-3 w-3" />
                  {pet.owner.firstName ? `${pet.owner.firstName} ${pet.owner.lastName || ''}`.trim() : pet.owner.email}
                </Badge>
              )}
              {showTrainer && (
                pet.trainer ? (
                  <Badge variant="outline" className="text-xs" data-testid={`badge-trainer-${pet.id}`}>
                    <User className="mr-1 h-3 w-3" />
                    {pet.trainer.firstName ? `${pet.trainer.firstName} ${pet.trainer.lastName || ''}`.trim() : pet.trainer.email}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    No trainer assigned
                  </Badge>
                )
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function PetCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function InviteSection() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { data: invite } = useQuery<{ inviteToken: string; workspaceId: string; businessName: string | null }>({
    queryKey: ["/api/workspaces/invite"],
  });

  if (!invite) return null;

  const inviteUrl = `${window.location.origin}/join?token=${invite.inviteToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with pet owners." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Invite Pet Owners</CardTitle>
        </div>
        <CardDescription>
          Share this link with pet owners so they can join your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono" data-testid="text-invite-link">
            {inviteUrl}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            data-testid="button-copy-invite"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowQR(!showQR)}
            data-testid="button-show-qr"
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
        {showQR && (
          <div className="flex justify-center rounded-md border bg-white p-4">
            <QRCodeSVG value={inviteUrl} size={200} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "ADMIN";
  const isTrainer = user?.role === "TRAINER" || isAdmin;
  const isOwner = user?.role === "OWNER" || isAdmin;

  const { data: pets, isLoading } = useQuery<PetWithRelations[]>({
    queryKey: ["/api/pets"],
  });

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
              variant="ghost" 
              size="icon"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.firstName || "there"}!
            </h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "View all pets as admin"
                : isTrainer
                ? "Here are the pets you're training"
                : "Manage your pets and their training"}
            </p>
          </div>
          {isOwner && (
            <Button 
              className="gap-2"
              onClick={() => navigate("/pets/new")}
              data-testid="button-add-pet"
            >
              <Plus className="h-4 w-4" />
              Add Pet
            </Button>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "User"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant={isAdmin ? "destructive" : isTrainer ? "default" : "secondary"}>
              {isAdmin ? "Admin" : isTrainer ? "Trainer" : "Pet Owner"}
            </Badge>
          </CardContent>
        </Card>

        {isTrainer && <InviteSection />}

        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {isAdmin ? "All Your Pets" : isTrainer ? "Pets You're Training" : "Your Pets"}
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <PetCardSkeleton />
            <PetCardSkeleton />
            <PetCardSkeleton />
          </div>
        ) : pets && pets.length > 0 ? (
          <div className="space-y-4">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} userRole={user?.role || "OWNER"} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <PawPrint className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {isTrainer ? "No Pets Assigned" : "No Pets Yet"}
              </h3>
              <p className="mb-4 text-center text-muted-foreground">
                {isTrainer
                  ? "Share your invite link above with pet owners to get started."
                  : "Add your first pet to get started with training homework."}
              </p>
              {!isTrainer && (
                <Button 
                  className="gap-2"
                  onClick={() => navigate("/pets/new")}
                  data-testid="button-add-first-pet"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Pet
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
