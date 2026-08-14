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
