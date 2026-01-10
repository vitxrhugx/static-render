-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  sector TEXT NOT NULL DEFAULT 'outros',
  logo TEXT,
  config JSONB NOT NULL DEFAULT '{
    "thresholds": {
      "precipitation": {"warning": 10, "critical": 25},
      "wind": {"warning": 30, "critical": 50},
      "temperature": {"min": 5, "max": 40}
    },
    "customFields": [],
    "enabledMetrics": ["operacoes"],
    "notifications": {"email": true, "push": false, "sms": false}
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization_locations table
CREATE TABLE public.organization_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  type TEXT NOT NULL DEFAULT 'operation_point',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create operational_data table
CREATE TABLE public.operational_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.organization_locations(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  scheduled_operations INTEGER NOT NULL DEFAULT 0,
  completed_operations INTEGER NOT NULL DEFAULT 0,
  cancelled_operations INTEGER NOT NULL DEFAULT 0,
  cancellation_reason TEXT,
  weather_impact BOOLEAN DEFAULT false,
  custom_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organizations"
ON public.organizations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organizations"
ON public.organizations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizations"
ON public.organizations FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for organization_locations (through organization ownership)
CREATE POLICY "Users can view locations of their organizations"
ON public.organization_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = organization_locations.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create locations for their organizations"
ON public.organization_locations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = organization_locations.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update locations of their organizations"
ON public.organization_locations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = organization_locations.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete locations of their organizations"
ON public.organization_locations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = organization_locations.organization_id
    AND organizations.user_id = auth.uid()
  )
);

-- RLS Policies for operational_data (through organization ownership)
CREATE POLICY "Users can view operational data of their organizations"
ON public.operational_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = operational_data.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create operational data for their organizations"
ON public.operational_data FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = operational_data.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update operational data of their organizations"
ON public.operational_data FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = operational_data.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete operational data of their organizations"
ON public.operational_data FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = operational_data.organization_id
    AND organizations.user_id = auth.uid()
  )
);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER on_organizations_updated
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_organizations_user_id ON public.organizations(user_id);
CREATE INDEX idx_organization_locations_org_id ON public.organization_locations(organization_id);
CREATE INDEX idx_operational_data_org_id ON public.operational_data(organization_id);
CREATE INDEX idx_operational_data_date ON public.operational_data(date);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);