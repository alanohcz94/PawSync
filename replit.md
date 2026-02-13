# PawSync

## Overview

PawSync is a trainer-led pet training homework management system. It serves as a single source of truth where trainers assign homework tasks to pet owners, owners submit completion proof with photos/videos, and trainers review submissions on a timeline with comments.

The core workflow is: Trainer assigns homework → Owner submits completion with proof → Trainer reviews on timeline and comments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Design**: Mobile-first responsive design targeting 360px-430px widths scaling up to desktop

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful endpoints under `/api` prefix
- **File Uploads**: Multer middleware storing files locally in `/uploads` directory
- **Build**: esbuild for server bundling, Vite for client bundling

### Authentication
- **Strategy**: Replit Auth (OIDC) supporting Google, GitHub, Apple, email/password
- **Sessions**: Express sessions stored in PostgreSQL using connect-pg-simple
- **Role System**: Three roles - "TRAINER", "OWNER", and "ADMIN"
  - TRAINER: Can create tasks, view assigned pets, comment on submissions
  - OWNER: Can view owned pets, submit homework for tasks
  - ADMIN: Full access to all trainer and owner capabilities regardless of pet assignment

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions and relations
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Key Data Models
- **Users**: id, email, name, role, avatarUrl
- **Pets**: linked to owner (required) and trainer (optional)
- **HomeworkTasks**: created by trainers, assigned to pets, editable
- **TaskMedia**: demonstration images/videos attached to tasks by trainers
- **HomeworkSubmissions**: created by owners with notes, task selected via dropdown
- **SubmissionMedia**: images/videos attached to submissions
- **TrainerComments**: feedback on submissions

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components and dialogs
    pages/        # Route pages
    lib/          # Utilities, auth, query client
    hooks/        # Custom React hooks
server/           # Express backend
  auth.ts         # Authentication setup
  routes.ts       # API endpoints
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared between client and server
  schema.ts       # Drizzle schema definitions
```

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- connect-pg-simple for session storage

### Authentication
- Google OAuth 2.0 (requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`)
- Passport.js with passport-google-oauth20 strategy

### File Storage
- Local filesystem storage in `/uploads` directory
- Multer for handling multipart form data
- Supports images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, QuickTime)
- 50MB file size limit

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `SESSION_SECRET`: Secret for session encryption (optional, has default)
- `REPLIT_DEV_DOMAIN`: Auto-set by Replit for OAuth callback URLs

## Recent Changes (February 2026)

### ADMIN Role Implementation
- Added ADMIN role with full trainer and owner permissions
- ADMIN users can view all pets, create tasks on any pet, and comment on any submission
- Authorization checks in server/routes.ts include ADMIN override for:
  - GET /api/tasks/:petId
  - POST /api/tasks
  - POST /api/submissions/:id/comment
  - GET /api/timeline/:petId

### API Endpoint Updates
- Changed tasks GET endpoint from `/api/tasks?petId=xxx` to `/api/tasks/:petId` (path parameter)
- This matches the URL pattern expected by React Query's default fetcher

### Pet Detail Page Features
- Three-tab interface: Tasks, Calendar, Timeline
- Calendar view shows monthly grid with colored completion indicators (green/yellow/red)
- Inline comment functionality on timeline submissions
- Action bar with "Add Task" and "Submit Homework" buttons for users with both permissions

### Task Edit Feature (Feb 6, 2026)
- Trainers can edit existing homework tasks via pencil icon on task cards
- PATCH /api/tasks/:id endpoint updates task fields without affecting historical submissions
- Create-task dialog supports both create and edit modes with pre-filled form data

### Task Selection in Submission (Feb 6, 2026)
- Submit homework dialog now includes a task dropdown for selecting active tasks
- Owners can click "Submit Homework" button and pick any active task from the dropdown
- When clicking "Done" on a specific task card, that task is pre-selected in the dropdown

### Demonstration Media (Feb 6, 2026)
- New `task_media` database table stores instructional media attached to tasks
- Trainers can upload demo photos/videos when creating or editing tasks
- Task cards show a clickable "demo files" badge to expand/collapse media preview
- Submission dialog shows trainer's demo media when a task is selected
- API endpoints: POST/GET/DELETE /api/tasks/:taskId/media

### Timeline Weekly Grouping (Feb 6, 2026)
- Timeline items grouped by calendar week (Monday-based)
- Current week: "This Week (Feb 3 - Feb 9)"
- Previous weeks: "Week of Jan 27 - Feb 2"

### Task Close/Archive Feature (Feb 6, 2026)
- Trainers can close/archive tasks via archive icon on task cards
- Closed tasks appear greyed out with strikethrough in a separate "Closed Tasks" section
- Closed tasks don't appear in submission dropdown or generate calendar entries
- Trainers can reopen closed tasks via restore icon
- Server rejects submissions on closed tasks (400 error)

### Owner Name on Dashboard (Feb 6, 2026)
- Trainer dashboard pet cards show owner name instead of trainer name
- Admin dashboard shows both owner and trainer names
- Owner dashboard shows trainer name (unchanged behavior)

### Edit Pet Details (Feb 6, 2026)
- New pet fields: breed, age, ownerPhone added to schema
- PATCH /api/pets/:id endpoint for updating pet details (owner or admin only)
- Edit pet dialog accessible via pencil icon on pet detail page header
- Supports image upload, name, species, breed, age, owner phone
- Pet detail header shows breed, age, and phone info

### Preferred Execution Days (Feb 7, 2026)
- New `preferredDays` text array column on homework_tasks (nullable)
- PATCH /api/tasks/:id/preferred-days endpoint for owners/admins to set preferred days
- Day-of-week selector (Mon-Sun toggle buttons) shown on active task cards for owners
- Trainers see selected days as small outline badges on task cards
- No days selected = current default setup (no restrictions)
- Does not affect submission logic (purely informational)

### Progress Tab - Submissions by Task (Feb 7, 2026)
- New "Progress" tab added to pet detail page (4 tabs: Tasks, Progress, Calendar, Timeline)
- Shows each task as a collapsible card with submission count badge
- Expanding a task reveals chronologically ordered submissions
- Each submission row shows date, time, note preview, media/comment badges
- Clicking a submission opens the existing SubmissionDetailDialog
- Includes both active and closed tasks (closed shown with opacity/strikethrough)

### Calendar Preferred Days Integration (Feb 7, 2026)
- Calendar view now respects owner-selected preferred days
- getTasksForDay checks task.preferredDays first, falls back to frequency-based defaults
- Only days matching preferredDays show colored indicators when set

### Trainer Comment Attachments (Feb 7, 2026)
- New `comment_media` table for media attached to trainer feedback comments
- Comment API endpoint (POST /api/submissions/:id/comment) accepts multipart/form-data with optional file
- Submission detail dialog has attach button (paperclip icon) for trainers to upload media with comments
- Comment media displayed inline in submission detail dialog, timeline inline comments, and standalone comment timeline items
- Both timeline inline comments and dialog comments use FormData for submission

### Media Preview Improvements (Feb 7, 2026)
- Fullscreen media viewer dialog now has proper accessibility titles
- Video type detection improved to include .mov files
- Images display with object-contain in fullscreen for better viewing

### Workspace-Based Onboarding Refactor (Feb 13, 2026)
- Removed manual role selection; roles are now auto-assigned based on workspace flow
- New `workspaces` table: id, trainerUserId, inviteToken (base64url, 24 bytes), businessName, bio
- New `workspace_members` table: id, workspaceId, userId, role (TRAINER/OWNER)
- Added `onboardingComplete` boolean flag to users table
- Trainer flow: New user → TrainerSetup page (name, business, bio, photo) → workspace auto-created → dashboard
- Owner flow: Open /join?token=xxx → sign in → join workspace (role=OWNER) → AddPet page → dashboard
- Existing users migrated: workspaces created from trainer-pet relationships, all marked onboardingComplete=true
- Dashboard now shows invite link section for trainers with copy button and QR code
- API endpoints: POST /api/workspaces/trainer-profile, GET /api/workspaces/validate/:token, POST /api/workspaces/join, GET /api/workspaces/invite
- Migration runs on startup if no workspaces exist (server/migrate-workspaces.ts)