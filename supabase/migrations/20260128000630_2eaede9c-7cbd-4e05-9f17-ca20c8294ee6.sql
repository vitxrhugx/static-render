-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de user_roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função segura para verificar role (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Policies para user_roles (apenas admins podem gerenciar)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.is_admin());

-- Atualizar policies de organizations para permitir admin ver tudo
CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all organizations"
ON public.organizations FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete all organizations"
ON public.organizations FOR DELETE
USING (public.is_admin());

-- Atualizar policies de operational_data para permitir admin ver tudo
CREATE POLICY "Admins can view all operational data"
ON public.operational_data FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert all operational data"
ON public.operational_data FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all operational data"
ON public.operational_data FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete all operational data"
ON public.operational_data FOR DELETE
USING (public.is_admin());

-- Atualizar policies de organization_locations para permitir admin ver tudo
CREATE POLICY "Admins can view all locations"
ON public.organization_locations FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert all locations"
ON public.organization_locations FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all locations"
ON public.organization_locations FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete all locations"
ON public.organization_locations FOR DELETE
USING (public.is_admin());

-- Atualizar policies de profiles para permitir admin ver tudo
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin());