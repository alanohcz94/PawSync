import { db } from "./db";
import { users, pets, workspaces, workspaceMembers } from "@shared/schema";
import { eq, or, and, isNull } from "drizzle-orm";
import crypto from "crypto";

export async function migrateToWorkspaces() {
  const existingWorkspaces = await db.select().from(workspaces);
  if (existingWorkspaces.length > 0) {
    console.log("Workspaces already exist, skipping migration");
    return;
  }

  console.log("Starting workspace migration...");

  const trainers = await db.select().from(users).where(
    or(eq(users.role, "TRAINER"), eq(users.role, "ADMIN"))
  );

  for (const trainer of trainers) {
    const inviteToken = crypto.randomBytes(24).toString("base64url");
    const [workspace] = await db.insert(workspaces).values({
      trainerUserId: trainer.id,
      inviteToken,
    }).returning();

    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: trainer.id,
      role: "TRAINER",
    });

    console.log(`Created workspace for trainer ${trainer.email} (${workspace.id})`);

    const trainerPets = await db.select().from(pets).where(eq(pets.trainerId, trainer.id));
    const ownerIds: string[] = [];
    for (const pet of trainerPets) {
      await db.update(pets)
        .set({ workspaceId: workspace.id })
        .where(eq(pets.id, pet.id));
      if (!ownerIds.includes(pet.ownerId)) {
        ownerIds.push(pet.ownerId);
      }
    }

    for (const ownerId of ownerIds) {
      if (ownerId === trainer.id) continue;
      const existing = await db.select().from(workspaceMembers).where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, ownerId)
        )
      );
      if (existing.length === 0) {
        await db.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId: ownerId,
          role: "OWNER",
        });
        console.log(`Added owner ${ownerId} to workspace ${workspace.id}`);
      }
    }
  }

  await db.update(users)
    .set({ onboardingComplete: true })
    .where(or(eq(users.role, "TRAINER"), eq(users.role, "OWNER"), eq(users.role, "ADMIN")));

  console.log("Workspace migration complete!");
}
