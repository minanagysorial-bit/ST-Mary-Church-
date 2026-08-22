# St. Mary Moharam Bek Digital Hub

A church digital platform built with React + TypeScript + Vite and backed by Supabase.
The system supports public church content plus role-based dashboards for admin, priest, servant, board, and membership teams.

## 1) Project Overview

This project combines:

- Public-facing website pages (home, sermons, registration, prayer requests).
- Internal dashboards for operational church work.
- Role-based authentication and permissions.
- Supabase database, authentication, and realtime features.
- Structured feature modules: sermons, services/families, meetings/projects, quizzes, membership workflows.

## 2) Technology Stack

- Frontend: React 19, TypeScript, React Router.
- Build tool: Vite.
- Backend-as-a-service: Supabase (`@supabase/supabase-js`).
- Icons/UI assets: `lucide-react`.
- Linting: `oxlint`.

## 3) Main Application Modules

### Public Pages

- `/` Home page.
- `/sermons` Sermons library.
- `/sermons/:id` Sermon details.
- `/login` Login.
- `/register` User registration.
- `/membership/register` Public membership request form.

### Role-Based Dashboards

- Admin:
  - `/admin`
  - `/admin/sermons`
  - `/admin/members`
  - `/admin/content`
  - `/admin/permissions`
  - `/admin/verses`

- Priest:
  - `/priest`
  - `/priest/liturgies`
  - `/priest/sermons`
  - `/priest/announcements`
  - `/priest/services`
  - `/priest/monitoring`
  - `/priest/comments`
  - `/priest/membership-requests`
  - `/priest/member-visitation`

- Servant:
  - `/servant`
  - `/servant/families`
  - `/servant/visitation`
  - `/servant/attendance`
  - `/servant/tools`

- Board:
  - `/board`
  - `/board/financials`
  - `/board/projects`
  - `/board/agenda`

- Membership:
  - `/membership`
  - `/membership/members`

- Quiz/Gamification:
  - `/quiz`
  - `/quiz/host/:sessionId`
  - `/quiz/play`

## 4) Authentication and Authorization

Authentication and session management are handled in `src/contexts/AuthContext.tsx`.

### Roles

- `super_admin`
- `admin`
- `priest`
- `servant`
- `board`
- `membership`

### Permission Model

- Permission keys are centralized in `src/lib/permissions.ts`.
- Route guards are enforced through `ProtectedRoute` in `src/App.tsx`.
- Super admin and admin bypass all permission checks.
- Other roles are checked per route and permission key.
- User-specific permissions are stored in `user_permissions`.

## 5) Data Layer and API

The app uses a centralized API service in `src/lib/api.ts` to communicate with Supabase.

Core domains include:

- Sermons.
- Members and profiles.
- Liturgies.
- Meetings and projects.
- Financial records.
- Families and family members.
- Church services and service groups.
- Visitation and attendance records.
- Quizzes, sessions, players, and answers.
- Verses, announcements, and site settings.
- Membership requests, church members, and member visitations.

Supabase client setup is in `src/lib/supabase.ts`, using:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 6) Database and Migrations

Database SQL files are stored in `supabase/migrations`.

Current migration set includes:

1. `001_initial_schema.sql`
2. `002_seed_data.sql`
3. `003_admin_profiles_policy.sql`
4. `003_create_super_admin.sql`
5. `004_fix_auth_users_nulls.sql`
6. `005_admin_full_privileges.sql`
7. `006_create_liturgies.sql`
8. `007_services_visitations.sql`
9. `008_quiz_tables.sql`
10. `009_quiz_realtime_refactor.sql`
11. `010_content_announcements.sql`
12. `011_family_members.sql`
13. `012_family_types.sql`
14. `013_membership_visitation.sql`
15. `rbac_migration.sql`

Additional setup and diagnostics scripts are in `supabase/`:

- `full_setup.sql`
- `step0_diagnostic.sql`
- `step1_cleanup.sql`
- `step2_create.sql`
- `hotfix_rls.sql`

## 7) Project Structure

```text
.
├─ src/
│  ├─ components/
│  │  ├─ common/
│  │  └─ sermons/
│  ├─ contexts/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  │  ├─ admin/
│  │  ├─ priest/
│  │  ├─ servant/
│  │  ├─ board/
│  │  ├─ membership/
│  │  └─ quiz/
│  ├─ App.tsx
│  └─ index.css
├─ supabase/
│  ├─ migrations/
│  └─ *.sql setup scripts
├─ index.html
├─ package.json
└─ README.md
```

## 8) Local Development Setup

### Prerequisites

- Node.js (LTS recommended).
- npm.
- Supabase project (URL + anon key).

### Installation

```bash
npm install
```

### Environment

Create a `.env` file in project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server

```bash
npm run dev
```

### Build Production Bundle

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## 9) Feature Notes

- Quiz module supports host/player flows and realtime scoring logic (with RPC fallback behavior).
- Membership workflow supports request submission, priest review, and transfer to official church members.
- Announcement module supports permanent, day-limited, and specific-day display logic.
- Routing layout hides public navbar/footer for dashboard sections.

## 10) Operational Recommendations

- Keep permission keys synchronized between `permissions.ts`, DB values, and admin UI.
- Apply Supabase migrations in order for consistent environments.
- Add `.env.example` if onboarding new developers.
- Add automated tests for critical flows:
  - Login and protected routes.
  - Membership request approval pipeline.
  - Quiz session lifecycle.
  - Role/permission enforcement.

## 11) Security Notes

- Never commit secrets or private credentials.
- `.env` should stay local and ignored in version control.
- Prefer server-side RPCs for sensitive scoring and state transitions when possible.

## 12) Maintenance Checklist

- Update this README when adding:
  - New routes/pages.
  - New permission keys.
  - New migrations.
  - New environment variables.

---

If you want, the next step can be generating a second document (`docs/USER_GUIDE.md`) that explains how each church role uses the system screen-by-screen in Arabic for non-technical users.
