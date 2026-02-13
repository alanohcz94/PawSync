import { 
  users, pets, homeworkTasks, homeworkSubmissions, submissionMedia, trainerComments, taskMedia, commentMedia,
  workspaces, workspaceMembers,
  type User,
  type Pet, type InsertPet, type PetWithRelations,
  type HomeworkTask, type InsertHomeworkTask, type HomeworkTaskWithRelations,
  type HomeworkSubmission, type InsertHomeworkSubmission, type HomeworkSubmissionWithRelations,
  type SubmissionMedia, type InsertSubmissionMedia,
  type TaskMedia, type InsertTaskMedia,
  type TrainerComment, type InsertTrainerComment, type TrainerCommentWithRelations,
  type CommentMedia, type InsertCommentMedia,
  type TimelineItem,
  type Workspace, type InsertWorkspace, type WorkspaceWithRelations,
  type WorkspaceMember, type InsertWorkspaceMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  getPet(id: string): Promise<PetWithRelations | undefined>;
  getPetsByOwner(ownerId: string): Promise<PetWithRelations[]>;
  getPetsByTrainer(trainerId: string): Promise<PetWithRelations[]>;
  getAllPets(): Promise<PetWithRelations[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: string, updates: Partial<Pick<Pet, "name" | "species" | "breed" | "age" | "ownerPhone" | "imageUrl">>): Promise<Pet | undefined>;
  assignTrainer(petId: string, trainerId: string): Promise<Pet | undefined>;
  
  getTasksByPet(petId: string): Promise<HomeworkTaskWithRelations[]>;
  getTask(id: string): Promise<HomeworkTask | undefined>;
  getTaskWithMedia(id: string): Promise<HomeworkTaskWithRelations | undefined>;
  createTask(task: InsertHomeworkTask): Promise<HomeworkTask>;
  updateTask(id: string, updates: Partial<Pick<HomeworkTask, "title" | "instructions" | "frequency" | "expectedDurationMins" | "isActive" | "preferredDays">>): Promise<HomeworkTask | undefined>;
  
  createTaskMedia(media: InsertTaskMedia): Promise<TaskMedia>;
  getTaskMedia(taskId: string): Promise<TaskMedia[]>;
  deleteTaskMedia(id: string): Promise<void>;
  
  getSubmission(id: string): Promise<HomeworkSubmissionWithRelations | undefined>;
  getSubmissionsByPet(petId: string): Promise<HomeworkSubmissionWithRelations[]>;
  createSubmission(submission: InsertHomeworkSubmission): Promise<HomeworkSubmission>;
  
  createSubmissionMedia(media: InsertSubmissionMedia): Promise<SubmissionMedia>;
  
  getCommentsBySubmission(submissionId: string): Promise<TrainerCommentWithRelations[]>;
  createComment(comment: InsertTrainerComment): Promise<TrainerComment>;
  createCommentMedia(media: InsertCommentMedia): Promise<CommentMedia>;
  
  getTimeline(petId: string): Promise<TimelineItem[]>;
  
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspace(id: string): Promise<WorkspaceWithRelations | undefined>;
  getWorkspaceByToken(token: string): Promise<WorkspaceWithRelations | undefined>;
  getWorkspaceByTrainer(trainerId: string): Promise<WorkspaceWithRelations | undefined>;
  updateWorkspace(id: string, updates: Partial<Pick<Workspace, "businessName" | "bio">>): Promise<Workspace | undefined>;
  
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { user?: User })[]>;
  getUserWorkspaces(userId: string): Promise<WorkspaceMember[]>;
  
  updateUser(id: string, updates: Partial<Pick<User, "firstName" | "lastName" | "profileImageUrl" | "role" | "onboardingComplete">>): Promise<User | undefined>;
  getPetsByWorkspace(workspaceId: string): Promise<PetWithRelations[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getPet(id: string): Promise<PetWithRelations | undefined> {
    const result = await db.query.pets.findFirst({
      where: eq(pets.id, id),
      with: {
        owner: true,
        trainer: true,
        tasks: true,
      },
    });
    return result || undefined;
  }

  async getPetsByOwner(ownerId: string): Promise<PetWithRelations[]> {
    const result = await db.query.pets.findMany({
      where: eq(pets.ownerId, ownerId),
      with: {
        owner: true,
        trainer: true,
      },
      orderBy: [desc(pets.createdAt)],
    });
    return result;
  }

  async getPetsByTrainer(trainerId: string): Promise<PetWithRelations[]> {
    const result = await db.query.pets.findMany({
      where: eq(pets.trainerId, trainerId),
      with: {
        owner: true,
        trainer: true,
      },
      orderBy: [desc(pets.createdAt)],
    });
    return result;
  }

  async getAllPets(): Promise<PetWithRelations[]> {
    const result = await db.query.pets.findMany({
      with: {
        owner: true,
        trainer: true,
      },
      orderBy: [desc(pets.createdAt)],
    });
    return result;
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const [pet] = await db.insert(pets).values(insertPet).returning();
    return pet;
  }

  async updatePet(id: string, updates: Partial<Pick<Pet, "name" | "species" | "breed" | "age" | "ownerPhone" | "imageUrl">>): Promise<Pet | undefined> {
    const [pet] = await db
      .update(pets)
      .set(updates)
      .where(eq(pets.id, id))
      .returning();
    return pet || undefined;
  }

  async assignTrainer(petId: string, trainerId: string): Promise<Pet | undefined> {
    const [pet] = await db
      .update(pets)
      .set({ trainerId })
      .where(eq(pets.id, petId))
      .returning();
    return pet || undefined;
  }

  async getTasksByPet(petId: string): Promise<HomeworkTaskWithRelations[]> {
    const result = await db.query.homeworkTasks.findMany({
      where: eq(homeworkTasks.petId, petId),
      with: {
        pet: true,
        trainer: true,
        media: true,
      },
      orderBy: [desc(homeworkTasks.createdAt)],
    });
    return result;
  }

  async getTask(id: string): Promise<HomeworkTask | undefined> {
    const [task] = await db.select().from(homeworkTasks).where(eq(homeworkTasks.id, id));
    return task || undefined;
  }

  async getTaskWithMedia(id: string): Promise<HomeworkTaskWithRelations | undefined> {
    const result = await db.query.homeworkTasks.findFirst({
      where: eq(homeworkTasks.id, id),
      with: {
        pet: true,
        trainer: true,
        media: true,
      },
    });
    return result || undefined;
  }

  async createTask(insertTask: InsertHomeworkTask): Promise<HomeworkTask> {
    const [task] = await db.insert(homeworkTasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Pick<HomeworkTask, "title" | "instructions" | "frequency" | "expectedDurationMins" | "isActive" | "preferredDays">>): Promise<HomeworkTask | undefined> {
    const [task] = await db
      .update(homeworkTasks)
      .set(updates)
      .where(eq(homeworkTasks.id, id))
      .returning();
    return task || undefined;
  }

  async createTaskMedia(insertMedia: InsertTaskMedia): Promise<TaskMedia> {
    const [media] = await db.insert(taskMedia).values(insertMedia).returning();
    return media;
  }

  async getTaskMedia(taskId: string): Promise<TaskMedia[]> {
    return await db.select().from(taskMedia).where(eq(taskMedia.taskId, taskId));
  }

  async deleteTaskMedia(id: string): Promise<void> {
    await db.delete(taskMedia).where(eq(taskMedia.id, id));
  }

  async getSubmission(id: string): Promise<HomeworkSubmissionWithRelations | undefined> {
    const result = await db.query.homeworkSubmissions.findFirst({
      where: eq(homeworkSubmissions.id, id),
      with: {
        task: true,
        submittedBy: true,
        media: true,
        comments: {
          with: {
            trainer: true,
            media: true,
          },
          orderBy: [desc(trainerComments.createdAt)],
        },
      },
    });
    return result || undefined;
  }

  async getSubmissionsByPet(petId: string): Promise<HomeworkSubmissionWithRelations[]> {
    const tasks = await db.select().from(homeworkTasks).where(eq(homeworkTasks.petId, petId));
    const taskIds = tasks.map(t => t.id);
    
    if (taskIds.length === 0) return [];

    const result = await db.query.homeworkSubmissions.findMany({
      where: or(...taskIds.map(id => eq(homeworkSubmissions.taskId, id))),
      with: {
        task: true,
        submittedBy: true,
        media: true,
        comments: {
          with: {
            trainer: true,
            media: true,
          },
        },
      },
      orderBy: [desc(homeworkSubmissions.submittedAt)],
    });
    return result;
  }

  async createSubmission(insertSubmission: InsertHomeworkSubmission): Promise<HomeworkSubmission> {
    const [submission] = await db.insert(homeworkSubmissions).values(insertSubmission).returning();
    return submission;
  }

  async createSubmissionMedia(insertMedia: InsertSubmissionMedia): Promise<SubmissionMedia> {
    const [media] = await db.insert(submissionMedia).values(insertMedia).returning();
    return media;
  }

  async getCommentsBySubmission(submissionId: string): Promise<TrainerCommentWithRelations[]> {
    const result = await db.query.trainerComments.findMany({
      where: eq(trainerComments.submissionId, submissionId),
      with: {
        trainer: true,
        media: true,
      },
      orderBy: [desc(trainerComments.createdAt)],
    });
    return result;
  }

  async createComment(insertComment: InsertTrainerComment): Promise<TrainerComment> {
    const [comment] = await db.insert(trainerComments).values(insertComment).returning();
    return comment;
  }

  async createCommentMedia(media: InsertCommentMedia): Promise<CommentMedia> {
    const [result] = await db.insert(commentMedia).values(media).returning();
    return result;
  }

  async getTimeline(petId: string): Promise<TimelineItem[]> {
    const tasks = await this.getTasksByPet(petId);
    const submissions = await this.getSubmissionsByPet(petId);
    
    const timelineItems: TimelineItem[] = [];

    for (const task of tasks) {
      timelineItems.push({
        type: "task",
        date: task.createdAt,
        data: task,
      });
    }

    for (const submission of submissions) {
      timelineItems.push({
        type: "submission",
        date: submission.submittedAt,
        data: submission,
      });

      if (submission.comments) {
        for (const comment of submission.comments) {
          timelineItems.push({
            type: "comment",
            date: comment.createdAt,
            data: comment,
          });
        }
      }
    }

    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return timelineItems;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db.insert(workspaces).values(insertWorkspace).returning();
    return workspace;
  }

  async getWorkspace(id: string): Promise<WorkspaceWithRelations | undefined> {
    const result = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, id),
      with: {
        trainer: true,
        members: {
          with: { user: true },
        },
      },
    });
    return result || undefined;
  }

  async getWorkspaceByToken(token: string): Promise<WorkspaceWithRelations | undefined> {
    const result = await db.query.workspaces.findFirst({
      where: eq(workspaces.inviteToken, token),
      with: {
        trainer: true,
        members: {
          with: { user: true },
        },
      },
    });
    return result || undefined;
  }

  async getWorkspaceByTrainer(trainerId: string): Promise<WorkspaceWithRelations | undefined> {
    const result = await db.query.workspaces.findFirst({
      where: eq(workspaces.trainerUserId, trainerId),
      with: {
        trainer: true,
        members: {
          with: { user: true },
        },
      },
    });
    return result || undefined;
  }

  async updateWorkspace(id: string, updates: Partial<Pick<Workspace, "businessName" | "bio">>): Promise<Workspace | undefined> {
    const [workspace] = await db
      .update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, id))
      .returning();
    return workspace || undefined;
  }

  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [result] = await db.insert(workspaceMembers).values(member).returning();
    return result;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { user?: User })[]> {
    const result = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: { user: true },
    });
    return result;
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMember[]> {
    return await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId));
  }

  async updateUser(id: string, updates: Partial<Pick<User, "firstName" | "lastName" | "profileImageUrl" | "role" | "onboardingComplete">>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getPetsByWorkspace(workspaceId: string): Promise<PetWithRelations[]> {
    const result = await db.query.pets.findMany({
      where: eq(pets.workspaceId, workspaceId),
      with: {
        owner: true,
        trainer: true,
      },
      orderBy: [desc(pets.createdAt)],
    });
    return result;
  }
}

export const storage = new DatabaseStorage();
