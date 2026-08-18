-- 0. Setup dummy auth schema for Prisma Shadow Database
DO $$
BEGIN
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS auth';
  EXECUTE 'CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY, raw_user_meta_data JSONB, email TEXT)';
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE proname = 'uid' AND n.nspname = 'auth'
  ) THEN
    EXECUTE 'CREATE FUNCTION auth.uid() RETURNS UUID AS $func$ SELECT null::uuid; $func$ LANGUAGE sql';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore permission errors in the real Supabase database where these already exist
    NULL;
END $$;

-- 1. Create is_admin function (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_adm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = $1 AND role = 'ADMIN'
  ) INTO is_adm;
  RETURN is_adm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for auth.users -> public.users & public.user_private
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, username, name, college_id, department_id, year, verification_status, availability, created_at, updated_at)
  VALUES (
    NEW.id,
    'user_' || substr(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NULL,
    NULL,
    NULL,
    'PENDING',
    'AVAILABLE',
    NOW(),
    NOW()
  );

  -- Insert into user_private table
  INSERT INTO public.user_private (user_id, college_email, erp, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'erp_' || substr(NEW.id::text, 1, 8), -- Temp ERP to bypass unique constraint until verification
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Trigger to prevent college_email updates in user_private
CREATE OR REPLACE FUNCTION public.prevent_college_email_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.college_email IS DISTINCT FROM NEW.college_email THEN
    -- Allow if admin or backend service (auth.uid() is null for service role)
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'college_email is immutable and cannot be changed by non-admins.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_private_update
  BEFORE UPDATE ON public.user_private
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_college_email_update();

-- 4. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. Define Policies

-- USERS
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- USER PRIVATE
CREATE POLICY "Users can view own private data" ON public.user_private FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can update private data" ON public.user_private FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete private data" ON public.user_private FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert private data" ON public.user_private FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- VERIFICATION REQUESTS
CREATE POLICY "Users can view own verification requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can insert own verification requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can update own verification requests" ON public.verification_requests FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete verification requests" ON public.verification_requests FOR DELETE USING (public.is_admin(auth.uid()));

-- SKILLS
CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage skills" ON public.skills FOR ALL USING (public.is_admin(auth.uid()));

-- USER SKILLS & INTERESTS
CREATE POLICY "User skills viewable by everyone" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "User interests viewable by everyone" ON public.user_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own interests" ON public.user_interests FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- SKILL RELATIONSHIPS
CREATE POLICY "Skill relationships viewable by everyone" ON public.skill_relationships FOR SELECT USING (true);
CREATE POLICY "Admins can manage skill relationships" ON public.skill_relationships FOR ALL USING (public.is_admin(auth.uid()));

-- PROJECTS & ACHIEVEMENTS
CREATE POLICY "Projects viewable by everyone if public or owner" ON public.projects FOR SELECT USING (is_private = false OR auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Project skills viewable by everyone if project public or owner" ON public.project_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (is_private = false OR user_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "Users can manage own project skills" ON public.project_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (user_id = auth.uid() OR public.is_admin(auth.uid())))
);

CREATE POLICY "Achievements viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- EVENTS & ANNOUNCEMENTS
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Announcements viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin(auth.uid()));

-- TEAMS
CREATE POLICY "Teams viewable by everyone if active/full or member" ON public.teams FOR SELECT USING (
  status IN ('ACTIVE', 'FULL') OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid()) OR public.is_admin(auth.uid())
);
CREATE POLICY "Verified users can insert teams" ON public.teams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND verification_status = 'APPROVED')
);
CREATE POLICY "Team leaders can update teams" ON public.teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid() AND membership_role IN ('LEADER', 'CO_LEADER')) OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE USING (public.is_admin(auth.uid()));

-- TEAM ROLES & ROLE SKILLS
CREATE POLICY "Team roles viewable by everyone if team active/full or member" ON public.team_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND (status IN ('ACTIVE', 'FULL') OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = public.teams.id AND user_id = auth.uid()) OR public.is_admin(auth.uid())))
);
CREATE POLICY "Team leaders can manage team roles" ON public.team_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_roles.team_id AND user_id = auth.uid() AND membership_role IN ('LEADER', 'CO_LEADER')) OR public.is_admin(auth.uid())
);

CREATE POLICY "Role skills viewable by everyone if team active/full or member" ON public.role_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_roles WHERE id = role_id AND EXISTS (SELECT 1 FROM public.teams WHERE id = public.team_roles.team_id AND (status IN ('ACTIVE', 'FULL') OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = public.teams.id AND user_id = auth.uid()) OR public.is_admin(auth.uid()))))
);
CREATE POLICY "Team leaders can manage role skills" ON public.role_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.team_roles WHERE id = role_id AND EXISTS (SELECT 1 FROM public.team_members WHERE team_id = public.team_roles.team_id AND user_id = auth.uid() AND membership_role IN ('LEADER', 'CO_LEADER'))) OR public.is_admin(auth.uid())
);

-- TEAM MEMBERS
CREATE POLICY "Team members viewable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (public.is_admin(auth.uid()));

-- APPLICATIONS
CREATE POLICY "Applicants and Leaders can view applications" ON public.applications FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = applications.team_id AND user_id = auth.uid() AND membership_role IN ('LEADER', 'CO_LEADER')) OR public.is_admin(auth.uid())
);
CREATE POLICY "Verified users can apply" ON public.applications FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND verification_status = 'APPROVED')
);
CREATE POLICY "Users can withdraw applications" ON public.applications FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE USING (public.is_admin(auth.uid()));

-- INVITATIONS
CREATE POLICY "Recipients and Leaders can view invitations" ON public.invitations FOR SELECT USING (
  recipient_id = auth.uid() OR sender_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = invitations.team_id AND user_id = auth.uid() AND membership_role IN ('LEADER', 'CO_LEADER')) OR public.is_admin(auth.uid())
);
CREATE POLICY "Team leaders can invite" ON public.invitations FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.team_members WHERE team_id = invitations.team_id AND user_id = auth.uid() AND membership_role IN ('LEADER', 'CO_LEADER'))
);
CREATE POLICY "Users can decline invitations" ON public.invitations FOR UPDATE USING (
  recipient_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can delete invitations" ON public.invitations FOR DELETE USING (public.is_admin(auth.uid()));

-- RATINGS
CREATE POLICY "Aggregate views for ratings only" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Active members can insert ratings" ON public.ratings FOR INSERT WITH CHECK (
  rater_id = auth.uid() AND EXISTS (SELECT 1 FROM public.team_members WHERE team_id = ratings.team_id AND user_id = auth.uid() AND status = 'ACTIVE')
);
CREATE POLICY "Admins can manage ratings" ON public.ratings FOR ALL USING (public.is_admin(auth.uid()));

-- TEAM FILES
CREATE POLICY "Active team members can view files" ON public.team_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_files.team_id AND user_id = auth.uid() AND status = 'ACTIVE') OR public.is_admin(auth.uid())
);
CREATE POLICY "Active team members can insert files" ON public.team_files FOR INSERT WITH CHECK (
  uploader_id = auth.uid() AND EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_files.team_id AND user_id = auth.uid() AND status = 'ACTIVE')
);
CREATE POLICY "Uploaders and Admins can update files" ON public.team_files FOR UPDATE USING (
  uploader_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Active members and Admins can delete files" ON public.team_files FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_files.team_id AND user_id = auth.uid() AND status = 'ACTIVE') OR public.is_admin(auth.uid())
);

-- TEAM LINKS
CREATE POLICY "Active team members can view links" ON public.team_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_links.team_id AND user_id = auth.uid() AND status = 'ACTIVE') OR public.is_admin(auth.uid())
);
CREATE POLICY "Active team members can insert links" ON public.team_links FOR INSERT WITH CHECK (
  creator_id = auth.uid() AND EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_links.team_id AND user_id = auth.uid() AND status = 'ACTIVE')
);
CREATE POLICY "Creators and Admins can update links" ON public.team_links FOR UPDATE USING (
  creator_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Active members and Admins can delete links" ON public.team_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_links.team_id AND user_id = auth.uid() AND status = 'ACTIVE') OR public.is_admin(auth.uid())
);

-- CONVERSATIONS & MESSAGES
CREATE POLICY "Active team members can view conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = conversations.team_id AND user_id = auth.uid() AND status = 'ACTIVE') OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can manage conversations" ON public.conversations FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Active team members can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c JOIN public.team_members tm ON c.team_id = tm.team_id WHERE c.id = messages.conversation_id AND tm.user_id = auth.uid() AND tm.status = 'ACTIVE') OR public.is_admin(auth.uid())
);
CREATE POLICY "Active team members can insert messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c JOIN public.team_members tm ON c.team_id = tm.team_id WHERE c.id = messages.conversation_id AND tm.user_id = auth.uid() AND tm.status = 'ACTIVE')
);
CREATE POLICY "Senders and Admins can update messages" ON public.messages FOR UPDATE USING (
  sender_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE USING (public.is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- BOOKMARKS
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (user_id = auth.uid());

-- ACTIVITY LOGS
CREATE POLICY "Relevant members and Admins can view activity logs" ON public.activity_logs FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = activity_logs.team_id AND user_id = auth.uid()) OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can manage activity logs" ON public.activity_logs FOR ALL USING (public.is_admin(auth.uid()));