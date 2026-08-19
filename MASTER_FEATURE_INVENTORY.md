# MASTER FEATURE INVENTORY & SPECIFICATION
**Product:** Team Discovery  
**Architecture Reference:** Next.js 16 (App Router) + Prisma ORM + Supabase PostgreSQL  
**Document Status:** Complete Master Feature Inventory & Implementation Mapping  

---

# 1. Product Area Master Inventory (Areas A through X)

$$\begin{array}{|l|l|c|l|}
\hline
\textbf{Area} & \textbf{Product Domain} & \textbf{Feature Count} & \textbf{Primary Implementation Scope} \\
\hline
\textbf{A} & \text{Authentication} & 4 & \text{Supabase SSR Auth, Login, Signup, Session Guard} \\
\textbf{B} & \text{Student Verification} & 3 & \text{Institutional ERP, College Email Immutability, Status Badges} \\
\textbf{C} & \text{Profile \& Portfolio} & 6 & \text{Skills Matrix, Interests, Projects, Achievements, Availability} \\
\textbf{D} & \text{Discovery \& Matching} & 5 & \text{Exact/Related/Interest Buckets, Intra-Sorting, Experience Engine} \\
\textbf{E} & \text{Global Search} & 2 & \text{Cmd+K Modal, Multi-Entity Search (Users, Teams, Projects, Events)} \\
\textbf{F} & \text{Teams / Squads} & 7 & \text{Catalog, Builder Wizard, Details, Roster, Leave Squad, Leader Transfer} \\
\textbf{G} & \text{Team Roles} & 4 & \text{Role Builder, Capacity Tracking, Status Lifecycle, Role Deletion} \\
\textbf{H} & \text{Applications} & 4 & \text{Apply Modal, Applicant Tracking, Leader Decision, Auto-Closure} \\
\textbf{I} & \text{Invitations} & 4 & \text{Direct Invite Modal, Recipient Inbox, Accept/Decline, Expiry} \\
\textbf{J} & \text{Workspace Hub} & 3 & \text{Private Member Access, Overview, Member Capacity Badging} \\
\textbf{K} & \text{Workspace Chat} & 3 & \text{Squad Messaging Stream, Realtime Updates, Error Handling} \\
\textbf{L} & \text{Workspace Files} & 3 & \text{Team Resource Repository, Upload/Delete Actions, Member Scoping} \\
\textbf{M} & \text{Workspace Links} & 3 & \text{Resource Bookmarking, Quick Access Cards, CRUD Operations} \\
\textbf{N} & \text{Events \& Hackathons} & 4 & \text{Hackathon Directory, Showcase Details, Event Roster, Deadlines} \\
\textbf{O} & \text{Notifications Center} & 4 & \text{In-App Alerts Feed, Unread Badges, Mark Read, Clear Actions} \\
\textbf{P} & \text{Bookmarks / Saved} & 3 & \text{Sliding Drawer, Multi-Target Saving, Instant Toggle} \\
\textbf{Q} & \text{Ratings \& Reputation} & 4 & \text{Peer Review Modal, Star Ratings, Review Count, Anti-Self-Rating} \\
\textbf{R} & \text{Admin / Moderation} & 3 & \text{is\_admin() Security Function, ERP Review, Taxonomy Management} \\
\textbf{S} & \text{Role Expiry Automation} & 2 & \text{Vercel Cron API, Idempotent Role Auto-Closure} \\
\textbf{T} & \text{Security \& Permissions} & 4 & \text{Row-Level Security (RLS), Atomic Row Locking, Private Data Guards} \\
\textbf{U} & \text{Responsive Experience} & 3 & \text{Fluid Breakpoints (375px, 768px, 1280px), Mobile Drawer Nav} \\
\textbf{V} & \text{Accessibility (a11y)} & 3 & \text{Keyboard Navigation, Screen Reader Labels, ARIA Modals} \\
\textbf{W} & \text{Micro-Interactions} & 3 & \text{Framer Motion, Shimmer Skeletons, Reduced-Motion Fallbacks} \\
\textbf{X} & \text{Activity Logs \& Extras} & 3 & \text{Auditable Activity Stream, Event Announcements, Seed Engine} \\
\hline
\textbf{Total} & \textbf{24 Product Areas} & \textbf{83} & \textbf{Comprehensive Platform Capability Set} \\
\hline
\end{array}$$

---

# 2. Detailed Feature Specifications & Implementation Mapping

### Area A: Authentication
1. **A.1 Student Signup (`/signup`):**
   - *Intended Behavior:* Allows new student registration with Full Name, College Email, and Password. Creates Supabase Auth record, which triggers automatic PostgreSQL provisioning of `public.users` and `public.user_private`. If already authenticated, auto-redirects to `/dashboard`.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(auth)/signup/page.tsx`, `signup-form-client.tsx`, `auth.ts`).
2. **A.2 Student Login (`/login`):**
   - *Intended Behavior:* Authenticates student with email/password, sets secure SSR cookies, and redirects immediately to `/dashboard`.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(auth)/login/page.tsx`, `login-form-client.tsx`, `auth.ts`).
3. **A.3 Session Guard & SSR Authentication:**
   - *Intended Behavior:* Validates Supabase session on every protected request via Next.js Middleware and server-side `getUser()` calls. Rejects unauthenticated requests with HTTP 307 redirect to `/login`.
   - *Implementation Status:* **[COMPLETE]** (`src/utils/supabase/middleware.ts`, `server.ts`).
4. **A.4 Secure Logout:**
   - *Intended Behavior:* Invalidates session on server, deletes cookies, and redirects user to landing page.
   - *Implementation Status:* **[COMPLETE]** (`logout()` in `src/app/actions/auth.ts`).

---

### Area B: Student Verification
1. **B.1 Verification Status Notice (`/verify`):**
   - *Intended Behavior:* Displays account status (`PENDING`, `APPROVED`, `REJECTED`) with explanatory guidance for student institutional verification.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(auth)/verify/page.tsx`).
2. **B.2 College Email & ERP Immutability:**
   - *Intended Behavior:* College email is stored in `public.user_private` and protected against mutation by standard users via PostgreSQL trigger `prevent_college_email_update()`.
   - *Implementation Status:* **[COMPLETE]** (`20260817172840_rls_and_auth_trigger/migration.sql`).
3. **B.3 Profile Verification Gate (`requireCompleteProfile`):**
   - *Intended Behavior:* Blocks unverified users (`status !== 'APPROVED'`) or users without complete profile data from applying to teams or creating squads.
   - *Implementation Status:* **[COMPLETE]** (`src/app/actions/applications.ts`, `teams.ts`).

---

### Area C: Profile & Portfolio
1. **C.1 Profile Editor (`/profile`):**
   - *Intended Behavior:* Edit bio, full name, username, department, academic year, and availability status.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/profile/profile-editor-client.tsx`, `profile.ts`).
2. **C.2 Skills Matrix Management:**
   - *Intended Behavior:* Add/remove verified technical skills with proficiency tags (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
   - *Implementation Status:* **[COMPLETE]** (`addUserSkill()`, `removeUserSkill()` in `profile.ts`).
3. **C.3 User Interests Declaration:**
   - *Intended Behavior:* Add/remove domain interests that feed into Tier 3 (`INTEREST ONLY`) matching.
   - *Implementation Status:* **[COMPLETE]** (`addUserInterest()`, `removeUserInterest()` in `profile.ts`).
4. **C.4 Project Portfolio:**
   - *Intended Behavior:* Showcase completed projects with title, description, role, GitHub, Figma, and demo links.
   - *Implementation Status:* **[COMPLETE]** (`createProject()`, `deleteProject()` in `profile.ts`).
5. **C.5 Achievements & Hackathon Honors:**
   - *Intended Behavior:* List verified competition awards, hackathon podium finishes, and certifications.
   - *Implementation Status:* **[COMPLETE]** (`createAchievement()`, `deleteAchievement()` in `profile.ts`).
6. **C.6 Public Candidate Portfolio (`/users/[id]`):**
   - *Intended Behavior:* Public view of candidate credentials, skills, portfolio evidence, peer ratings, and direct invite button for team leaders.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/users/[id]/page.tsx`).

---

### Area D: Discovery & Matching Engine
1. **D.1 Role-Based Candidate Discovery (`/discover`):**
   - *Intended Behavior:* Squad leaders select an open recruitment role and receive a categorized candidate recommendation stream.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/discover/page.tsx`, `discovery-client.tsx`, `matching.ts`).
2. **D.2 Exact Match Bucketing (Tier 1):**
   - *Intended Behavior:* Highlights candidates possessing at least one skill tagged as `REQUIRED` in role definition.
   - *Implementation Status:* **[COMPLETE]** (`getMatchedCandidatesForRole()` in `matching.ts`).
3. **D.3 Related Match Bucketing (Tier 2):**
   - *Intended Behavior:* Identifies candidates with skills related via `skill_relationships` graph.
   - *Implementation Status:* **[COMPLETE]** (`matching.ts`).
4. **D.4 Interest Only Match Bucketing (Tier 3):**
   - *Intended Behavior:* Identifies candidates with declared interests matching the role domain.
   - *Implementation Status:* **[COMPLETE]** (`matching.ts`).
5. **D.5 Deterministic Experience Engine:**
   - *Intended Behavior:* Computes `BEGINNER` (0 projects), `SOME_EXPERIENCE` (1 project), or `EXPERIENCED` ($\ge 2$ projects) from verifiable evidence.
   - *Implementation Status:* **[COMPLETE]** (`matching.ts`).

---

### Area E: Global Search
1. **E.1 Instant Global Search Dialog (Cmd+K):**
   - *Intended Behavior:* Modal dialog with debounce search indexing Students, Squads, Projects, and Hackathons.
   - *Implementation Status:* **[COMPLETE]** (`src/components/search/global-search-dialog.tsx`, `search.ts`).
2. **E.2 Search Projection Security:**
   - *Intended Behavior:* Excludes sensitive private fields (ERP, email) from search results.
   - *Implementation Status:* **[COMPLETE]** (`globalSearch()` in `search.ts`).

---

### Area F: Teams & Squads
1. **F.1 Teams Catalog (`/teams`):**
   - *Intended Behavior:* Filterable catalog of all recruiting squads, event tags, open seat chips, and role requirements.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/teams/page.tsx`, `teams-catalog-client.tsx`, `teams.ts`).
2. **F.2 Squad Creation Wizard (`/teams/create`):**
   - *Intended Behavior:* Multi-step wizard to create team, assign event, and define initial recruitment roles.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/teams/create/page.tsx`, `team-create-client.tsx`, `teams.ts`).
3. **F.3 Team Details & Roster (`/teams/[id]`):**
   - *Intended Behavior:* Displays squad description, event context, active members roster, and open role application cards.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/teams/[id]/page.tsx`, `team-details-client.tsx`).
4. **F.4 Leave Squad UI (GAP-IMP-01):**
   - *Intended Behavior:* Allows active non-leader members to voluntarily leave a squad with seat recalculation.
   - *Implementation Status:* **[COMPLETE]** (`leave-team-dialog.tsx`, `workspace-members-panel.tsx`, `team-details-client.tsx`, `teams.ts`).
5. **F.5 Transfer Leadership Action (GAP-IMP-02):**
   - *Intended Behavior:* Allows squad leader to transfer ownership to another active member.
   - *Implementation Status:* **[BACKEND-ONLY]** (`transferLeadership()` exists in `teams.ts`; UI dropdown button in leader menu pending).
6. **F.6 Squad Status Auto-Transition:**
   - *Intended Behavior:* Automatically transitions team status to `FULL` when all active roles are 100% filled, and back to `ACTIVE` when a seat opens.
   - *Implementation Status:* **[COMPLETE]** (`teams.ts`, `applications.ts`, `invitations.ts`).
7. **F.7 One-Team-Per-Event Enforcement:**
   - *Intended Behavior:* Prevents candidates from joining or holding active membership in multiple squads for the same hackathon.
   - *Implementation Status:* **[COMPLETE]** (Database Partial Unique Index + Server Action verification).

---

### Area G: Team Roles
1. **G.1 Role Management Builder (`role-management-dialog.tsx`):**
   - *Intended Behavior:* Leaders create and edit recruitment roles, setting required skills, preferred levels, experience, and deadlines.
   - *Implementation Status:* **[COMPLETE]** (`role-management-dialog.tsx`, `roles.ts`).
2. **G.2 Role Seat Capacity Tracking:**
   - *Intended Behavior:* Tracks occupied seats against `seats_required`, marking roles `PARTIALLY_FILLED` or `FULL`.
   - *Implementation Status:* **[COMPLETE]** (`applications.ts`, `invitations.ts`, `roles.ts`).
3. **G.3 Close Role Action (`close-role-dialog.tsx`):**
   - *Intended Behavior:* Manually closes a role, auto-closing any remaining pending applications.
   - *Implementation Status:* **[COMPLETE]** (`close-role-dialog.tsx`, `roles.ts`).
4. **G.4 Delete Vacant Role (GAP-IMP-03):**
   - *Intended Behavior:* Allows leaders to delete vacant, unoccupied recruitment roles.
   - *Implementation Status:* **[BACKEND-ONLY]** (`deleteTeamRole()` exists in `roles.ts`; UI button in role dialog pending).

---

### Area H: Applications
1. **H.1 Apply to Role Modal (`apply-modal.tsx`):**
   - *Intended Behavior:* Candidates apply to open roles with custom introductory messages and skill highlights.
   - *Implementation Status:* **[COMPLETE]** (`apply-modal.tsx`, `applications.ts`).
2. **H.2 Candidate Applications Hub (`/applications`):**
   - *Intended Behavior:* Dual-tab interface: "My Applications" (with withdrawal action) and "Incoming Applications" for leaders.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/applications/page.tsx`, `applications-dashboard-client.tsx`).
3. **H.3 Atomic Application Acceptance:**
   - *Intended Behavior:* Row-locked PostgreSQL transaction allocating seats and auto-closing competing candidates.
   - *Implementation Status:* **[COMPLETE]** (`acceptApplication()` in `applications.ts`).
4. **H.4 Application Auto-Closure:**
   - *Intended Behavior:* Automatically marks pending applications as `AUTO_CLOSED` when the last seat is taken.
   - *Implementation Status:* **[COMPLETE]** (`applications.ts`).

---

### Area I: Invitations
1. **I.1 Direct Invitation Modal (`invite-modal.tsx`):**
   - *Intended Behavior:* Leaders send binding role invitations to candidates found via discovery.
   - *Implementation Status:* **[COMPLETE]** (`invite-modal.tsx`, `invitations.ts`).
2. **I.2 Candidate Invitations Inbox (`/invitations`):**
   - *Intended Behavior:* Candidates accept or decline incoming invitations with countdown expiry timers.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/invitations/page.tsx`, `invitations-dashboard-client.tsx`).
3. **I.3 Atomic Invitation Acceptance:**
   - *Intended Behavior:* Row-locked transaction assigning role seat to recipient.
   - *Implementation Status:* **[COMPLETE]** (`acceptInvitation()` in `invitations.ts`).
4. **I.4 Competing Invitation Invalidation:**
   - *Intended Behavior:* Auto-declines competing pending invitations when a role reaches capacity.
   - *Implementation Status:* **[COMPLETE]** (`invitations.ts`).

---

### Area J: Team Collaboration Workspace
1. **J.1 Private Workspace Hub (`/teams/[id]/workspace`):**
   - *Intended Behavior:* Accessible exclusively to active squad members. Contains Chat, Files, Links, and Roster.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/teams/[id]/workspace/page.tsx`, `workspace-client.tsx`, `workspace.ts`).
2. **J.2 Member Authorization Barrier:**
   - *Intended Behavior:* Non-members attempting to enter are redirected with unauthorized error.
   - *Implementation Status:* **[COMPLETE]** (`getTeamWorkspace()` in `workspace.ts`).
3. **J.3 Squad Roster & Peer Action Menu:**
   - *Intended Behavior:* Displays member cards with roles, department, leave action, and peer review buttons.
   - *Implementation Status:* **[COMPLETE]** (`workspace-members-panel.tsx`).

---

### Area K: Workspace Chat
1. **K.1 Squad Conversation Stream (`workspace-chat.tsx`):**
   - *Intended Behavior:* Realtime team discussion room with message timestamps and sender avatars.
   - *Implementation Status:* **[COMPLETE]** (`workspace-chat.tsx`, `workspace.ts`).
2. **K.2 Send Message Action:**
   - *Intended Behavior:* Sends chat messages with server-validated sender identity.
   - *Implementation Status:* **[COMPLETE]** (`sendTeamMessage()` in `workspace.ts`).
3. **K.3 Message Optimistic Feedback & Scrolling:**
   - *Intended Behavior:* Auto-scrolls to bottom on new messages with responsive text wrapping.
   - *Implementation Status:* **[COMPLETE]** (`workspace-chat.tsx`).

---

### Area L: Workspace Files
1. **L.1 Team File Repository (`workspace-files-panel.tsx`):**
   - *Intended Behavior:* List shared design assets, documents, and code zip links.
   - *Implementation Status:* **[COMPLETE]** (`workspace-files-panel.tsx`, `workspace.ts`).
2. **L.2 Add File Action:**
   - *Intended Behavior:* Active members attach shared file resources with name and URL.
   - *Implementation Status:* **[COMPLETE]** (`addTeamFile()` in `workspace.ts`).
3. **L.3 Delete File Action:**
   - *Intended Behavior:* Allows uploader or leader to delete shared files.
   - *Implementation Status:* **[COMPLETE]** (`deleteTeamFile()` in `workspace.ts`).

---

### Area M: Workspace Quick Links
1. **M.1 Pinned Links Panel (`workspace-links-panel.tsx`):**
   - *Intended Behavior:* Pinned GitHub repositories, Figma boards, Notion workspaces, and slide decks.
   - *Implementation Status:* **[COMPLETE]** (`workspace-links-panel.tsx`, `workspace.ts`).
2. **M.2 Add Quick Link Action:**
   - *Intended Behavior:* Adds validated URL with custom title.
   - *Implementation Status:* **[COMPLETE]** (`addTeamLink()` in `workspace.ts`).
3. **M.3 Delete Quick Link Action:**
   - *Intended Behavior:* Removes link from panel.
   - *Implementation Status:* **[COMPLETE]** (`deleteTeamLink()` in `workspace.ts`).

---

### Area N: Events & Hackathons
1. **N.1 Events Directory (`/events`):**
   - *Intended Behavior:* Lists official hackathons, registration deadlines, and active squad counters.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/events/page.tsx`, `events-catalog-client.tsx`, `events.ts`).
2. **N.2 Event Showcase (`/events/[id]`):**
   - *Intended Behavior:* Displays event banner, competition rules, team size limits, countdown timers, and registered squads.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/events/[id]/page.tsx`, `event-details-client.tsx`, `events.ts`).
3. **N.3 Event Team Association:**
   - *Intended Behavior:* Squads link to official events during creation, enforcing one-team-per-event rules.
   - *Implementation Status:* **[COMPLETE]** (`teams.ts`, `events.ts`).
4. **N.4 Event Announcements:**
   - *Intended Behavior:* Broadcasts organizer updates and rule clarifications.
   - *Implementation Status:* **[COMPLETE]** (Database Model `announcements` + Event Showcase render).

---

### Area O: In-App Notifications
1. **O.1 Notifications Inbox (`/notifications`):**
   - *Intended Behavior:* Unified activity feed of team applications, invitations, acceptance notices, and system alerts.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/notifications/page.tsx`, `notification-list.tsx`, `notifications.ts`).
2. **O.2 Unread Badge Counters:**
   - *Intended Behavior:* Displays live unread notification count in AppShell navbar bell.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/layout.tsx`, `notifications.ts`).
3. **O.3 Mark As Read Action:**
   - *Intended Behavior:* Single-click or batch mark all notifications read.
   - *Implementation Status:* **[COMPLETE]** (`markNotificationRead()`, `markAllNotificationsRead()` in `notifications.ts`).
4. **O.4 Clear Notification Action:**
   - *Intended Behavior:* Deletes notification from personal feed.
   - *Implementation Status:* **[COMPLETE]** (`deleteNotification()` in `notifications.ts`).

---

### Area P: Bookmarks & Saved Items
1. **P.1 Saved Items Sliding Drawer (`saved-items-sheet.tsx`):**
   - *Intended Behavior:* Slide-out sheet displaying bookmarked Candidates, Squads, and Projects.
   - *Implementation Status:* **[COMPLETE]** (`saved-items-sheet.tsx`, `bookmarks.ts`).
2. **P.2 Instant Bookmark Toggle (`bookmark-button.tsx`):**
   - *Intended Behavior:* Reusable star/bookmark button on cards with optimistic visual state updates.
   - *Implementation Status:* **[COMPLETE]** (`bookmark-button.tsx`, `bookmarks.ts`).
3. **P.3 Bookmark Persistence:**
   - *Intended Behavior:* Backed by PostgreSQL unique constraint on `(user_id, target_type, target_id)`.
   - *Implementation Status:* **[COMPLETE]** (`toggleBookmark()` in `bookmarks.ts`).

---

### Area Q: Peer Ratings & Reputation
1. **Q.1 Peer Review Modal (`peer-review-modal.tsx`):**
   - *Intended Behavior:* Authenticated peers rate teammates (1 to 5 stars) with optional written feedback.
   - *Implementation Status:* **[COMPLETE]** (`peer-review-modal.tsx`, `ratings.ts`).
2. **Q.2 Peer Eligibility Validation:**
   - *Intended Behavior:* Verifies both rater and ratee participated in the same squad; prevents self-ratings and duplicate ratings.
   - *Implementation Status:* **[COMPLETE]** (`submitPeerRating()` in `ratings.ts`).
3. **Q.3 Star Rating Display & Aggregation:**
   - *Intended Behavior:* Displays average rating score and total review count on candidate cards (e.g. "⭐ 4.8 (5 reviews)").
   - *Implementation Status:* **[COMPLETE]** (`matching.ts`, `profile.ts`, candidate cards).
4. **Q.4 Unrated Candidate Neutrality:**
   - *Intended Behavior:* Candidates with 0 reviews display "No ratings yet" rather than an artificial 0 score.
   - *Implementation Status:* **[COMPLETE]** (Card components).

---

### Area R: Admin & Moderation
1. **R.1 Admin Security Function (`is_admin()`):**
   - *Intended Behavior:* PostgreSQL Security Definer function checking `public.user_roles` for `role = 'ADMIN'`.
   - *Implementation Status:* **[COMPLETE]** (`20260817172840_rls_and_auth_trigger/migration.sql`).
2. **R.2 Verification Request Management:**
   - *Intended Behavior:* Admin reviews and updates `verification_requests` status.
   - *Implementation Status:* **[COMPLETE]** (Database schema & RLS policies).
3. **R.3 Skills Taxonomy & Relationships:**
   - *Intended Behavior:* Admin curates canonical skills and `skill_relationships` strength graph.
   - *Implementation Status:* **[COMPLETE]** (Database schema, seed script).

---

### Area S: Role Expiry Automation
1. **S.1 Scheduled Cron Endpoint (`/api/cron/expire-roles`):**
   - *Intended Behavior:* Vercel Cron triggers endpoint with Bearer Secret to auto-expire past-deadline roles.
   - *Implementation Status:* **[COMPLETE]** (`src/app/api/cron/expire-roles/route.ts`, `roles.ts`).
2. **S.2 Idempotent Expiry Cleanup:**
   - *Intended Behavior:* Transitions expired roles to `EXPIRED`, auto-closes pending applications, and recalculates squad status.
   - *Implementation Status:* **[COMPLETE]** (`expireOverdueRoles()` in `roles.ts`).

---

### Area T: Security & Permissions
1. **T.1 PostgreSQL Row-Level Security (RLS):**
   - *Intended Behavior:* Enforces database-level read/write permissions on all 27 domain tables.
   - *Implementation Status:* **[COMPLETE]** (`20260817172840_rls_and_auth_trigger/migration.sql`).
2. **T.2 Concurrency Row Locks (`FOR UPDATE`):**
   - *Intended Behavior:* Row-locks `team_roles` during application/invitation acceptance to prevent race conditions.
   - *Implementation Status:* **[COMPLETE]** (`applications.ts`, `invitations.ts`).
3. **T.3 Private Data Isolation:**
   - *Intended Behavior:* Keeps student ERP and email strictly isolated from public search queries.
   - *Implementation Status:* **[COMPLETE]** (`src/lib/prisma.ts`, queries).
4. **T.4 Server-Side Auth Identity:**
   - *Intended Behavior:* Ignores client-supplied user IDs in production; validates identity via Supabase server client.
   - *Implementation Status:* **[COMPLETE]** (All Server Actions).

---

### Area U: Responsive & Mobile Experience
1. **U.1 Fluid Layouts (375px, 768px, 1280px):**
   - *Intended Behavior:* Responsive grids, wrapping badges, and touch-friendly controls.
   - *Implementation Status:* **[COMPLETE]** (Tailwind CSS v4).
2. **U.2 Mobile Navigation Sheet:**
   - *Intended Behavior:* Sliding drawer with navigation links, quick actions, and profile details on mobile.
   - *Implementation Status:* **[COMPLETE]** (`src/components/layout/mobile-nav.tsx`).
3. **U.3 Workspace Mobile Chat Optimization:**
   - *Intended Behavior:* Sticky message inputs and full-height chat views on mobile.
   - *Implementation Status:* **[COMPLETE]** (`workspace-chat.tsx`).

---

### Area V: Accessibility (a11y)
1. **V.1 Keyboard Navigation & Focus Rings:**
   - *Intended Behavior:* Visible focus outlines, keyboard tab navigation across modals and cards.
   - *Implementation Status:* **[COMPLETE]** (shadcn/ui primitives).
2. **V.2 Screen Reader Semantic Structure:**
   - *Intended Behavior:* Explicit heading hierarchies, ARIA tags on dialogs, and readable button labels.
   - *Implementation Status:* **[PARTIAL]** (Basic ARIA present; GAP-POL-01 covers additional dialog label annotations).
3. **V.3 Color-Independent Status Badges:**
   - *Intended Behavior:* Status badges combine colors with explicit icons and descriptive text.
   - *Implementation Status:* **[COMPLETE]** (Badge components).

---

### Area W: Micro-Interactions & Motion
1. **W.1 Fluid Transitions & Dialog Animations:**
   - *Intended Behavior:* Smooth entry/exit animations on sheets, dialogs, and dropdowns.
   - *Implementation Status:* **[COMPLETE]** (Framer Motion / Tailwind animations).
2. **W.2 Shimmer Loading Skeletons:**
   - *Intended Behavior:* Animated skeleton cards during async transitions.
   - *Implementation Status:* **[COMPLETE]** (Catalog and dashboard skeletons).
3. **W.3 Reduced Motion Compliance:**
   - *Intended Behavior:* Respects `prefers-reduced-motion` media queries for accessibility.
   - *Implementation Status:* **[COMPLETE]** (Tailwind motion utilities).

---

### Area X: Activity Logs & Extras
1. **X.1 Auditable Activity Stream:**
   - *Intended Behavior:* Tracks team creations, member additions, and milestone events in `activity_logs`.
   - *Implementation Status:* **[COMPLETE]** (`dashboard.ts`, `teams.ts`).
2. **X.2 Personal Command Center Dashboard (`/dashboard`):**
   - *Intended Behavior:* High-density dashboard with active squads, pending applications, invitations, registered events, and quick metrics.
   - *Implementation Status:* **[COMPLETE]** (`src/app/(app)/dashboard/page.tsx`, `dashboard-client.tsx`).
3. **X.3 Database Bootstrap & Seed Script:**
   - *Intended Behavior:* Initial seed data creating colleges, departments, canonical skills, skill relationships, demo events, and bootstrap admin.
   - *Implementation Status:* **[COMPLETE]** (`prisma/seed.ts`).

---

# 3. Master Implementation Gap & Priority Summary

$$\begin{array}{|l|l|c|l|c|}
\hline
\textbf{Feature Name} & \textbf{Intended Scope} & \textbf{Current State} & \textbf{Identified Gap} & \textbf{Priority} \\
\hline
\text{Leave Squad UI} & \text{Member voluntarily leaves squad} & \textbf{[COMPLETE]} & \text{Implemented in GAP-IMP-01} & \textbf{P0} \\
\text{Transfer Leadership UI} & \text{Leader transfers ownership to peer} & \textbf{[BACKEND-ONLY]} & \text{UI menu button in team leader menu} & \textbf{P1} \\
\text{Delete Vacant Role UI} & \text{Leader deletes unused draft role} & \textbf{[BACKEND-ONLY]} & \text{Delete button in role management dialog} & \textbf{P1} \\
\text{ARIA Dialog Annotations} & \text{Full screen-reader dialog parity} & \textbf{[PARTIAL]} & \text{Add explicit aria-labelledby on custom modals} & \textbf{P2} \\
\text{Card Grid Micro-motion} & \text{Staggered fade-in on card lists} & \textbf{[PARTIAL]} & \text{Add staggered motion to discovery/team grids} & \textbf{P3} \\
\hline
\end{array}$$
