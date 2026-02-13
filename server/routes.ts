import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { insertPetSchema, insertHomeworkTaskSchema, insertHomeworkSubmissionSchema, insertTrainerCommentSchema } from "@shared/schema";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  },
});

function getUserId(req: any): string | null {
  return req.user?.claims?.sub || null;
}

async function getUserWithRole(req: any) {
  const userId = getUserId(req);
  if (!userId) return null;
  return await storage.getUser(userId);
}

const requireTrainer: RequestHandler = async (req, res, next) => {
  const user = await getUserWithRole(req);
  if (user && (user.role === "TRAINER" || user.role === "ADMIN")) {
    (req as any).appUser = user;
    return next();
  }
  res.status(403).json({ message: "Trainer role required" });
};

const requireOwner: RequestHandler = async (req, res, next) => {
  const user = await getUserWithRole(req);
  if (user && (user.role === "OWNER" || user.role === "ADMIN")) {
    (req as any).appUser = user;
    return next();
  }
  res.status(403).json({ message: "Owner role required" });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  }, express.static(uploadDir));

  app.post("/api/auth/role", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { role } = req.body;
    if (role !== "TRAINER" && role !== "OWNER") {
      return res.status(400).json({ message: "Invalid role" });
    }

    try {
      const updatedUser = await storage.updateUserRole(userId, role);
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.post("/api/workspaces/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const existing = await storage.getWorkspaceByTrainer(userId);
      if (existing) {
        return res.json(existing);
      }

      const inviteToken = crypto.randomBytes(24).toString("base64url");
      const workspace = await storage.createWorkspace({
        trainerUserId: userId,
        inviteToken,
      });

      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId,
        role: "TRAINER",
      });

      await storage.updateUser(userId, { role: "TRAINER" });

      const full = await storage.getWorkspace(workspace.id);
      res.status(201).json(full);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  app.post("/api/workspaces/trainer-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const { displayName, businessName, bio, profilePhoto } = req.body;
      if (!displayName || displayName.trim().length === 0) {
        return res.status(400).json({ message: "Display name is required" });
      }

      const nameParts = displayName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || null;

      await storage.updateUser(userId, {
        firstName,
        lastName,
        profileImageUrl: profilePhoto || undefined,
        role: "TRAINER",
        onboardingComplete: true,
      });

      let workspace = await storage.getWorkspaceByTrainer(userId);
      if (!workspace) {
        const inviteToken = crypto.randomBytes(24).toString("base64url");
        workspace = await storage.createWorkspace({
          trainerUserId: userId,
          inviteToken,
          businessName: businessName || null,
          bio: bio || null,
        });
        await storage.addWorkspaceMember({
          workspaceId: workspace.id,
          userId,
          role: "TRAINER",
        });
      } else {
        await storage.updateWorkspace(workspace.id, {
          businessName: businessName || null,
          bio: bio || null,
        });
      }

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating trainer profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/workspaces/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const workspace = await storage.getWorkspaceByTrainer(userId);
      if (!workspace) {
        return res.status(404).json({ message: "No workspace found" });
      }

      res.json({
        inviteToken: workspace.inviteToken,
        workspaceId: workspace.id,
        businessName: workspace.businessName,
      });
    } catch (error) {
      console.error("Error getting invite:", error);
      res.status(500).json({ message: "Failed to get invite" });
    }
  });

  app.get("/api/workspaces/validate/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const workspace = await storage.getWorkspaceByToken(token);
      if (!workspace) {
        return res.status(404).json({ message: "Invalid invite link" });
      }

      res.json({
        workspaceId: workspace.id,
        trainerName: `${workspace.trainer?.firstName || ""} ${workspace.trainer?.lastName || ""}`.trim(),
        businessName: workspace.businessName,
      });
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  app.post("/api/workspaces/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Invite token required" });

      const workspace = await storage.getWorkspaceByToken(token);
      if (!workspace) {
        return res.status(404).json({ message: "Invalid invite link" });
      }

      if (workspace.trainerUserId === userId) {
        return res.status(400).json({ message: "You cannot join your own workspace as an owner" });
      }

      const existingMembers = await storage.getWorkspaceMembers(workspace.id);
      const alreadyMember = existingMembers.some(m => m.userId === userId);
      if (alreadyMember) {
        await storage.updateUser(userId, { role: "OWNER", onboardingComplete: false });
        return res.json({ workspaceId: workspace.id, alreadyMember: true });
      }

      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId,
        role: "OWNER",
      });

      await storage.updateUser(userId, { role: "OWNER", onboardingComplete: false });

      res.status(201).json({ workspaceId: workspace.id });
    } catch (error) {
      console.error("Error joining workspace:", error);
      res.status(500).json({ message: "Failed to join workspace" });
    }
  });

  app.get("/api/workspaces/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.role === "TRAINER") {
        const workspace = await storage.getWorkspaceByTrainer(userId);
        return res.json(workspace ? [workspace] : []);
      }

      const memberships = await storage.getUserWorkspaces(userId);
      const results = [];
      for (const m of memberships) {
        const ws = await storage.getWorkspace(m.workspaceId);
        if (ws) results.push(ws);
      }
      res.json(results);
    } catch (error) {
      console.error("Error getting workspaces:", error);
      res.status(500).json({ message: "Failed to get workspaces" });
    }
  });

  app.get("/api/pets", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserWithRole(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      let pets;
      if (user.role === "ADMIN") {
        pets = await storage.getAllPets();
      } else if (user.role === "TRAINER") {
        pets = await storage.getPetsByTrainer(user.id);
      } else {
        pets = await storage.getPetsByOwner(user.id);
      }
      
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  app.get("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const user = await getUserWithRole(req);
      const hasAccess = user && (user.role === "ADMIN" || pet.ownerId === user.id || pet.trainerId === user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(pet);
    } catch (error) {
      console.error("Error fetching pet:", error);
      res.status(500).json({ message: "Failed to fetch pet" });
    }
  });

  app.post("/api/pets", isAuthenticated, requireOwner, async (req: any, res) => {
    try {
      const user = req.appUser;
      const { name, species, trainerEmail, workspaceId } = req.body;
      
      let trainerId = null;
      let resolvedWorkspaceId = workspaceId || null;

      if (workspaceId) {
        const workspace = await storage.getWorkspace(workspaceId);
        if (workspace) {
          trainerId = workspace.trainerUserId;
        }
      } else if (trainerEmail) {
        const trainer = await storage.getUserByEmail(trainerEmail);
        if (!trainer) {
          return res.status(400).json({ message: "No user found with that email address" });
        }
        if (trainer.role !== "TRAINER") {
          return res.status(400).json({ message: "The specified user is not a trainer" });
        }
        trainerId = trainer.id;
        const trainerWorkspace = await storage.getWorkspaceByTrainer(trainer.id);
        if (trainerWorkspace) {
          resolvedWorkspaceId = trainerWorkspace.id;
        }
      } else {
        const memberships = await storage.getUserWorkspaces(user.id);
        const ownerMembership = memberships.find(m => m.role === "OWNER");
        if (ownerMembership) {
          resolvedWorkspaceId = ownerMembership.workspaceId;
          const workspace = await storage.getWorkspace(ownerMembership.workspaceId);
          if (workspace) {
            trainerId = workspace.trainerUserId;
          }
        }
      }

      const pet = await storage.createPet({
        name,
        species: species || null,
        ownerId: user.id,
        trainerId,
        workspaceId: resolvedWorkspaceId,
        imageUrl: null,
      });

      if (!user.onboardingComplete) {
        await storage.updateUser(user.id, { onboardingComplete: true });
      }

      res.status(201).json(pet);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.status(500).json({ message: "Failed to create pet" });
    }
  });

  app.patch("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserWithRole(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      if (pet.ownerId !== user.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only the pet owner can edit pet details" });
      }

      const { name, species, breed, age, ownerPhone, imageUrl } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (species !== undefined) updates.species = species;
      if (breed !== undefined) updates.breed = breed;
      if (age !== undefined) updates.age = age;
      if (ownerPhone !== undefined) updates.ownerPhone = ownerPhone;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;

      const updatedPet = await storage.updatePet(req.params.id, updates);
      res.json(updatedPet);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.status(500).json({ message: "Failed to update pet" });
    }
  });

  app.post("/api/pets/:id/trainer", isAuthenticated, requireOwner, async (req: any, res) => {
    try {
      const user = req.appUser;
      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      if (pet.ownerId !== user.id) {
        return res.status(403).json({ message: "You don't own this pet" });
      }

      const { trainerEmail } = req.body;
      const trainer = await storage.getUserByEmail(trainerEmail);
      
      if (!trainer) {
        return res.status(400).json({ message: "No user found with that email address" });
      }
      if (trainer.role !== "TRAINER") {
        return res.status(400).json({ message: "The specified user is not a trainer" });
      }

      const updatedPet = await storage.assignTrainer(pet.id, trainer.id);
      res.json(updatedPet);
    } catch (error) {
      console.error("Error assigning trainer:", error);
      res.status(500).json({ message: "Failed to assign trainer" });
    }
  });

  app.get("/api/tasks/:petId", isAuthenticated, async (req: any, res) => {
    try {
      const petId = req.params.petId;
      if (!petId) {
        return res.status(400).json({ message: "petId is required" });
      }

      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const user = await getUserWithRole(req);
      // Allow if user is owner, trainer, or ADMIN
      if (!user || (pet.ownerId !== user.id && pet.trainerId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const tasks = await storage.getTasksByPet(petId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, requireTrainer, async (req: any, res) => {
    try {
      const user = req.appUser;
      const { petId, title, instructions, frequency, expectedDurationMins } = req.body;

      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      // Allow if user is the assigned trainer OR is an ADMIN
      if (pet.trainerId !== user.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "You're not assigned to this pet" });
      }

      const task = await storage.createTask({
        petId,
        createdByTrainerId: user.id,
        title,
        instructions,
        frequency,
        expectedDurationMins: expectedDurationMins || null,
        isActive: true,
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, requireTrainer, async (req: any, res) => {
    try {
      const user = req.appUser;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const pet = await storage.getPet(task.petId);
      if (!pet || (pet.trainerId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "You're not assigned to this pet" });
      }

      const { title, instructions, frequency, expectedDurationMins, isActive } = req.body;
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (instructions !== undefined) updates.instructions = instructions;
      if (frequency !== undefined) updates.frequency = frequency;
      if (expectedDurationMins !== undefined) updates.expectedDurationMins = expectedDurationMins;
      if (isActive !== undefined) updates.isActive = isActive;

      const updatedTask = await storage.updateTask(req.params.id, updates);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.patch("/api/tasks/:id/preferred-days", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserWithRole(req);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const pet = await storage.getPet(task.petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      if (pet.ownerId !== user.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only the pet owner can set preferred days" });
      }

      const { preferredDays } = req.body;
      const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      if (preferredDays !== null && (!Array.isArray(preferredDays) || !preferredDays.every((d: string) => validDays.includes(d)))) {
        return res.status(400).json({ message: "Invalid preferred days" });
      }

      const updatedTask = await storage.updateTask(req.params.id, {
        preferredDays: preferredDays && preferredDays.length > 0 ? preferredDays : null,
      });
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating preferred days:", error);
      res.status(500).json({ message: "Failed to update preferred days" });
    }
  });

  app.get("/api/tasks/:taskId/media", isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const media = await storage.getTaskMedia(req.params.taskId);
      res.json(media);
    } catch (error) {
      console.error("Error fetching task media:", error);
      res.status(500).json({ message: "Failed to fetch task media" });
    }
  });

  app.post("/api/tasks/:taskId/media", isAuthenticated, requireTrainer, upload.single("file"), async (req: any, res) => {
    try {
      const user = req.appUser;
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const pet = await storage.getPet(task.petId);
      if (!pet || (pet.trainerId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "You're not assigned to this pet" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/${req.file.filename}`;
      const mediaType = req.file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";

      const media = await storage.createTaskMedia({
        taskId: task.id,
        mediaType,
        filePath,
        fileName: req.file.originalname,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error("Error uploading task media:", error);
      res.status(500).json({ message: "Failed to upload task media" });
    }
  });

  app.delete("/api/tasks/:taskId/media/:mediaId", isAuthenticated, requireTrainer, async (req: any, res) => {
    try {
      const user = req.appUser;
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const pet = await storage.getPet(task.petId);
      if (!pet || (pet.trainerId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "You're not assigned to this pet" });
      }

      await storage.deleteTaskMedia(req.params.mediaId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task media:", error);
      res.status(500).json({ message: "Failed to delete task media" });
    }
  });

  app.get("/api/submissions/:id", isAuthenticated, async (req, res) => {
    try {
      const submissionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json(submission);
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  app.post("/api/submissions", isAuthenticated, requireOwner, async (req: any, res) => {
    try {
      const user = req.appUser;
      const { taskId, note, media } = req.body;

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (!task.isActive) {
        return res.status(400).json({ message: "This task has been closed and no longer accepts submissions" });
      }

      const pet = await storage.getPet(task.petId);
      if (!pet || pet.ownerId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const submission = await storage.createSubmission({
        taskId,
        submittedByUserId: user.id,
        note: note || null,
        status: "COMPLETED",
      });

      if (media && Array.isArray(media)) {
        for (const mediaItem of media) {
          await storage.createSubmissionMedia({
            submissionId: submission.id,
            mediaType: mediaItem.mediaType,
            filePath: mediaItem.filePath,
            fileName: mediaItem.fileName || null,
          });
        }
      }

      const fullSubmission = await storage.getSubmission(submission.id);
      res.status(201).json(fullSubmission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.post("/api/submissions/:id/comment", isAuthenticated, requireTrainer, upload.single("file"), async (req: any, res) => {
    try {
      const user = req.appUser;
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const task = await storage.getTask(submission.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const pet = await storage.getPet(task.petId);
      if (!pet || (pet.trainerId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "You're not assigned to this pet" });
      }

      const comment = req.body.comment;
      if (!comment || typeof comment !== "string") {
        return res.status(400).json({ message: "Comment is required" });
      }

      const newComment = await storage.createComment({
        submissionId: submission.id,
        trainerId: user.id,
        comment,
      });

      if (req.file) {
        const filePath = `/uploads/${req.file.filename}`;
        const mediaType = req.file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
        await storage.createCommentMedia({
          commentId: newComment.id,
          mediaType,
          filePath,
          fileName: req.file.originalname,
        });
      }

      const updatedSubmission = await storage.getSubmission(submission.id);
      res.status(201).json(updatedSubmission);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/timeline/:petId", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.params.petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const user = await getUserWithRole(req);
      // Allow if user is owner, trainer, or ADMIN
      if (!user || (pet.ownerId !== user.id && pet.trainerId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const timeline = await storage.getTimeline(pet.id);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  app.post("/api/upload", isAuthenticated, upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/${req.file.filename}`;
      const mediaType = req.file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";

      res.json({
        filePath,
        mediaType,
        fileName: req.file.originalname,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  return httpServer;
}
