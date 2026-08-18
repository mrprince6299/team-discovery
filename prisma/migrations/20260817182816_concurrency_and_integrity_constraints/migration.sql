-- Concurrency and Database-Level Integrity Constraints

-- 1. One active team per event constraint
CREATE UNIQUE INDEX IF NOT EXISTS one_active_team_per_event 
  ON public.team_members (user_id, event_id) 
  WHERE status = 'ACTIVE' AND event_id IS NOT NULL;

-- 2. One active user per team constraint
CREATE UNIQUE INDEX IF NOT EXISTS one_active_user_per_team 
  ON public.team_members (team_id, user_id) 
  WHERE status = 'ACTIVE';

-- 3. Leadership integrity: exactly one active leader per team
CREATE UNIQUE INDEX IF NOT EXISTS one_active_leader_per_team 
  ON public.team_members (team_id) 
  WHERE status = 'ACTIVE' AND membership_role = 'LEADER';

-- 4. Leadership integrity: max one active co-leader per team
CREATE UNIQUE INDEX IF NOT EXISTS one_active_co_leader_per_team 
  ON public.team_members (team_id) 
  WHERE status = 'ACTIVE' AND membership_role = 'CO_LEADER';

-- 5. Application integrity: one pending or accepted application per user per team
CREATE UNIQUE INDEX IF NOT EXISTS active_application_per_team 
  ON public.applications (user_id, team_id) 
  WHERE status IN ('PENDING', 'ACCEPTED');

-- 6. Invitation integrity: one pending or accepted invitation per recipient per role
CREATE UNIQUE INDEX IF NOT EXISTS active_invitation_per_role 
  ON public.invitations (recipient_id, role_id) 
  WHERE status IN ('PENDING', 'ACCEPTED');

-- 7. Rating constraints: score between 1 and 5, no self-rating
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_score_check;
ALTER TABLE public.ratings ADD CONSTRAINT ratings_score_check CHECK (score >= 1 AND score <= 5);

ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_no_self_rating_check;
ALTER TABLE public.ratings ADD CONSTRAINT ratings_no_self_rating_check CHECK (rater_id != ratee_id);

-- 8. Team roles constraint: seats required >= 1
ALTER TABLE public.team_roles DROP CONSTRAINT IF EXISTS team_roles_seats_required_check;
ALTER TABLE public.team_roles ADD CONSTRAINT team_roles_seats_required_check CHECK (seats_required >= 1);