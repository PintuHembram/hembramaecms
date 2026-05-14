
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  host_family TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_all" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert_auth" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update_own" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "events_delete_own" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- contributors
CREATE TABLE public.contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  mobile TEXT,
  alt_mobile TEXT,
  village TEXT,
  contribution_date DATE DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contributors_select_all" ON public.contributors FOR SELECT TO authenticated USING (true);
CREATE POLICY "contributors_insert_auth" ON public.contributors FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "contributors_update_own" ON public.contributors FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "contributors_delete_own" ON public.contributors FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- contributions
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.contributors ON DELETE CASCADE,
  category TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  price NUMERIC,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contributions_select_all" ON public.contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "contributions_insert_auth" ON public.contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "contributions_update_own" ON public.contributions FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "contributions_delete_own" ON public.contributions FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE INDEX idx_contributions_event ON public.contributions(event_id);
CREATE INDEX idx_contributions_contributor ON public.contributions(contributor_id);
CREATE INDEX idx_contributors_village ON public.contributors(village);
CREATE INDEX idx_contributors_mobile ON public.contributors(mobile);
