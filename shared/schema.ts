import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const workspaces = pgTable("workspaces", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  trainerUserId: varchar("trainer_user_id", { length: 36 }).notNull().references(() => users.id),
  inviteToken: varchar("invite_token", { length: 64 }).notNull().unique(),
  businessName: text("business_name"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  trainer: one(users, {
    fields: [workspaces.trainerUserId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  pets: many(pets, { relationName: "workspace" }),
}));

export const workspaceMembers = pgTable("workspace_members", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id", { length: 36 }).notNull().references(() => workspaces.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ownedPets: many(pets, { relationName: "owner" }),
  trainedPets: many(pets, { relationName: "trainer" }),
  submissions: many(homeworkSubmissions),
  comments: many(trainerComments),
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMembers),
}));

export const pets = pgTable("pets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  species: text("species"),
  breed: text("breed"),
  age: text("age"),
  ownerPhone: text("owner_phone"),
  imageUrl: text("image_url"),
  ownerId: varchar("owner_id", { length: 36 }).notNull().references(() => users.id),
  trainerId: varchar("trainer_id", { length: 36 }).references(() => users.id),
  workspaceId: varchar("workspace_id", { length: 36 }).references(() => workspaces.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const petsRelations = relations(pets, ({ one, many }) => ({
  owner: one(users, {
    fields: [pets.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  trainer: one(users, {
    fields: [pets.trainerId],
    references: [users.id],
    relationName: "trainer",
  }),
  workspace: one(workspaces, {
    fields: [pets.workspaceId],
    references: [workspaces.id],
    relationName: "workspace",
  }),
  tasks: many(homeworkTasks),
}));

export const homeworkTasks = pgTable("homework_tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id", { length: 36 }).notNull().references(() => pets.id),
  createdByTrainerId: varchar("created_by_trainer_id", { length: 36 }).notNull().references(() => users.id),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  frequency: text("frequency").notNull(),
  expectedDurationMins: integer("expected_duration_mins"),
  isActive: boolean("is_active").default(true).notNull(),
  preferredDays: text("preferred_days").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskMedia = pgTable("task_media", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => homeworkTasks.id),
  mediaType: text("media_type").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskMediaRelations = relations(taskMedia, ({ one }) => ({
  task: one(homeworkTasks, {
    fields: [taskMedia.taskId],
    references: [homeworkTasks.id],
  }),
}));

export const homeworkTasksRelations = relations(homeworkTasks, ({ one, many }) => ({
  pet: one(pets, {
    fields: [homeworkTasks.petId],
    references: [pets.id],
  }),
  trainer: one(users, {
    fields: [homeworkTasks.createdByTrainerId],
    references: [users.id],
  }),
  submissions: many(homeworkSubmissions),
  media: many(taskMedia),
}));

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => homeworkTasks.id),
  submittedByUserId: varchar("submitted_by_user_id", { length: 36 }).notNull().references(() => users.id),
  note: text("note"),
  status: text("status").default("COMPLETED").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const homeworkSubmissionsRelations = relations(homeworkSubmissions, ({ one, many }) => ({
  task: one(homeworkTasks, {
    fields: [homeworkSubmissions.taskId],
    references: [homeworkTasks.id],
  }),
  submittedBy: one(users, {
    fields: [homeworkSubmissions.submittedByUserId],
    references: [users.id],
  }),
  media: many(submissionMedia),
  comments: many(trainerComments),
}));

export const submissionMedia = pgTable("submission_media", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id", { length: 36 }).notNull().references(() => homeworkSubmissions.id),
  mediaType: text("media_type").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissionMediaRelations = relations(submissionMedia, ({ one }) => ({
  submission: one(homeworkSubmissions, {
    fields: [submissionMedia.submissionId],
    references: [homeworkSubmissions.id],
  }),
}));

export const trainerComments = pgTable("trainer_comments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id", { length: 36 }).notNull().references(() => homeworkSubmissions.id),
  trainerId: varchar("trainer_id", { length: 36 }).notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainerCommentsRelations = relations(trainerComments, ({ one, many }) => ({
  submission: one(homeworkSubmissions, {
    fields: [trainerComments.submissionId],
    references: [homeworkSubmissions.id],
  }),
  trainer: one(users, {
    fields: [trainerComments.trainerId],
    references: [users.id],
  }),
  media: many(commentMedia),
}));

export const commentMedia = pgTable("comment_media", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id", { length: 36 }).notNull().references(() => trainerComments.id),
  mediaType: varchar("media_type", { length: 10 }).notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentMediaRelations = relations(commentMedia, ({ one }) => ({
  comment: one(trainerComments, {
    fields: [commentMedia.commentId],
    references: [trainerComments.id],
  }),
}));

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  createdAt: true,
});

export const insertHomeworkTaskSchema = createInsertSchema(homeworkTasks).omit({
  id: true,
  createdAt: true,
});

export const insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
});

export const insertTaskMediaSchema = createInsertSchema(taskMedia).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionMediaSchema = createInsertSchema(submissionMedia).omit({
  id: true,
  createdAt: true,
});

export const insertTrainerCommentSchema = createInsertSchema(trainerComments).omit({
  id: true,
  createdAt: true,
});

export const insertCommentMediaSchema = createInsertSchema(commentMedia).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

export type WorkspaceWithRelations = Workspace & {
  trainer?: User;
  members?: (WorkspaceMember & { user?: User })[];
};

export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;

export type InsertHomeworkTask = z.infer<typeof insertHomeworkTaskSchema>;
export type HomeworkTask = typeof homeworkTasks.$inferSelect;

export type InsertHomeworkSubmission = z.infer<typeof insertHomeworkSubmissionSchema>;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;

export type InsertTaskMedia = z.infer<typeof insertTaskMediaSchema>;
export type TaskMedia = typeof taskMedia.$inferSelect;

export type InsertSubmissionMedia = z.infer<typeof insertSubmissionMediaSchema>;
export type SubmissionMedia = typeof submissionMedia.$inferSelect;

export type InsertTrainerComment = z.infer<typeof insertTrainerCommentSchema>;
export type TrainerComment = typeof trainerComments.$inferSelect;

export type InsertCommentMedia = z.infer<typeof insertCommentMediaSchema>;
export type CommentMedia = typeof commentMedia.$inferSelect;

export type PetWithRelations = Pet & {
  owner?: User;
  trainer?: User | null;
  tasks?: HomeworkTask[];
};

export type HomeworkTaskWithRelations = HomeworkTask & {
  pet?: Pet;
  trainer?: User;
  submissions?: HomeworkSubmissionWithRelations[];
  media?: TaskMedia[];
};

export type HomeworkSubmissionWithRelations = HomeworkSubmission & {
  task?: HomeworkTask;
  submittedBy?: User;
  media?: SubmissionMedia[];
  comments?: TrainerCommentWithRelations[];
};

export type TrainerCommentWithRelations = TrainerComment & {
  trainer?: User;
  media?: CommentMedia[];
};

export type TimelineItem = {
  type: "task" | "submission" | "comment";
  date: Date;
  data: HomeworkTaskWithRelations | HomeworkSubmissionWithRelations | TrainerCommentWithRelations;
};

import type { User } from "./models/auth";
