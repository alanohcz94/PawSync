import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { PawPrint, Loader2, CheckCircle2, XCircle, GraduationCap } from "lucide-react";

export default function Join() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const [, navigate] = useLocation();
  const { user, login, refetchUser } = useAuth();
  const { toast } = useToast();

  const { data: validation, isLoading: validating, error: validationError } = useQuery({
    queryKey: ["/api/workspaces/validate", token],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const res = await fetch(`/api/workspaces/validate/${token}`);
      if (!res.ok) throw new Error("Invalid invite link");
      return res.json() as Promise<{ workspaceId: string; trainerName: string; businessName: string | null }>;
    },
    enabled: !!token,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to join");
      }
      return res.json();
    },
    onSuccess: async () => {
      await refetchUser();
      navigate("/pets/new");
    },
    onError: (error: Error) => {
      toast({
        title: "Could not join",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>This invite link is missing or invalid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying invite link...</p>
      </div>
    );
  }

  if (validationError || !validation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is no longer valid. Please ask your trainer for a new one.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <PawPrint className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Join PawSync</CardTitle>
            <CardDescription>
              <span className="flex items-center justify-center gap-2 mt-2">
                <GraduationCap className="h-4 w-4" />
                <span>{validation.trainerName}</span>
              </span>
              {validation.businessName && (
                <span className="block mt-1 text-sm">{validation.businessName}</span>
              )}
              <span className="block mt-2">has invited you to join their training workspace.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={login}
              data-testid="button-login-join"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            <span className="flex items-center justify-center gap-2 mt-2 text-base">
              <GraduationCap className="h-4 w-4" />
              <span className="font-medium">{validation.trainerName}</span>
            </span>
            {validation.businessName && (
              <span className="block mt-1">{validation.businessName}</span>
            )}
            <span className="block mt-2">
              Join this training workspace to add your pet and start tracking homework.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full gap-2"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            data-testid="button-join-workspace"
          >
            {joinMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <PawPrint className="h-4 w-4" />
                Join Workspace
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
