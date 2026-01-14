-- Deny anonymous access to profiles table (protects user emails)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to organizations table (protects CNPJ and business data)
CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations
FOR SELECT
TO anon
USING (false);

-- Also add explicit denial for other operations on profiles for anon
CREATE POLICY "Deny anonymous insert on profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update on profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (false);

-- Also add explicit denial for other operations on organizations for anon
CREATE POLICY "Deny anonymous insert on organizations"
ON public.organizations
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update on organizations"
ON public.organizations
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete on organizations"
ON public.organizations
FOR DELETE
TO anon
USING (false);