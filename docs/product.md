A collaborative platform for software development teams to manage projects, tasks, communication, and team activity in one place.

First target user

Small software development teams.

Core features

For V1:

Authentication
Organizations
Teams
Projects
Tasks
Comments
Notifications
Real-time updates
Dashboard

DAY 1 — DEVCOLLAB ✅

✓ Project structure
✓ Frontend foundation
✓ Backend skeleton
✓ Express API
✓ /api/health
✓ PostgreSQL schema
✓ Prisma
✓ Docker
✓ PostgreSQL running in Docker
✓ Prisma 7 adapter setup

Day 2 — Authentication ✅

## Completed

- Added Zod validation
- Added password hashing with bcrypt
- Added user registration
- Added user login
- Added JWT authentication
- Added authentication middleware
- Added protected /api/users/me endpoint
- Connected authentication to PostgreSQL

## Architecture

Request
→ Route
→ Middleware
→ Controller
→ Service
→ Prisma
→ PostgreSQL

## Organizations

□ Create organization
□ Creator automatically becomes OWNER
□ Get organization
□ Only members can access organization

Members
□ Add member
□ Prevent duplicate members
□ List members
□ MEMBER / ADMIN / OWNER roles

RBAC
□ OWNER permissions
□ ADMIN permissions
□ MEMBER restrictions
□ Change member roles
□ Prevent arbitrary OWNER creation
□ Protect unauthorized organizations

DevCollab — Day 5
✅ Added TypeScript strict checking with npx tsc --noEmit
✅ Fixed JWT/Express TypeScript errors
✅ Fixed route parameter typing
✅ Completed organization role management
OWNER can change roles
Supports ADMIN / MEMBER
OWNER cannot be demoted
✅ Completed Task Management foundation
Task schema
Controllers
Services
Validation
Project ↔ Task relationships
Task assignees
✅ Improved authentication + organization authorization
✅ Verified backend compiles with 0 TypeScript errors


Day 6 — Finish Backend Foundation

We've already completed:

✅ Authentication
✅ Organizations
✅ Team/member roles
✅ Projects
✅ Tasks
✅ Authorization
✅ Validation
✅ PostgreSQL + Prisma

                    DevCollab
                       │
          ┌────────────┴────────────┐
          │                         │
      Frontend                    Backend
       ✅ MVP                      ✅ Core API
          │                         │
     React/Vite                 Express/Node
     TypeScript                 JWT Auth
     Tailwind                   Prisma
     shadcn/ui                  PostgreSQL
     React Router               Organizations
     Mock data                  Roles/RBAC
     Kanban UI                  Projects
     Dashboard                  Tasks
     Responsive UI

     Day 7 — What we did so far
🔐 Connected frontend authentication to the real backend
Login now stores the JWT accessToken.
Stored authenticated user in localStorage.
Added isAuthenticated() and requireAuth().
Protected routes such as /dashboard.
🌐 Created frontend API client
Centralized GET, POST, PATCH, and DELETE requests.

Automatically sends:

Authorization: Bearer <token>
Handles API errors consistently.
🏢 Connected Organizations API
Get current user's organizations.
Get organization details.
Get organization members.
Create organizations.
Add members.
Update member roles.
Implemented OWNER / ADMIN / MEMBER roles.
🛡️ Implemented backend authorization
JWT authentication middleware.
Organization membership verification.
Role-based authorization middleware.
OWNER protection for role changes.
Prevented organization owners from being demoted.
📁 Connected Projects API
Create projects.
Get organization projects.
Get individual projects.
Projects verify organization membership before access.
🔄 Migrated WorkspaceProvider from mock users/organizations/projects to API data
Authenticated user comes from the real backend.
Organizations come from PostgreSQL.
Organization members come from PostgreSQL.
Projects come from PostgreSQL.
Added loading/error states.
Added refreshWorkspace().
🧩 Kept the migration incremental
Tasks, comments, activities and notifications are still mocked for now.
This avoids changing the entire application at once.
🐛 Fixed TypeScript issues
Fixed nullable currentUser handling.
Removed incorrect authenticatedUser usage.
npx tsc --noEmit now passes with 0 errors.
🧪 Verified backend endpoints
Authentication test → 200 OK
Organization endpoints → 200 OK
Project endpoints → 200 OK