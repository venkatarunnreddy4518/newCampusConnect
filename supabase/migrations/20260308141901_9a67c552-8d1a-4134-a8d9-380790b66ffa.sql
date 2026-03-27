
-- Create permission type enum
CREATE TYPE public.permission_type AS ENUM (
  'event_manager',
  'club_manager',
  'registration_manager',
  'content_moderator'
);

-- Create permissions table for granular sub-admin roles
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission permission_type NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global', -- 'global' or 'specific'
  resource_id UUID, -- null for global, specific event/club id for per-item
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission, scope, resource_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON public.permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _permission permission_type,
  _resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.permissions
    WHERE user_id = _user_id
      AND permission = _permission
      AND (
        scope = 'global'
        OR (_resource_id IS NOT NULL AND resource_id = _resource_id)
      )
  )
$$;

-- Update events policies to allow event_managers and content_moderators
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Authorized users can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'event_manager')
    OR public.has_permission(auth.uid(), 'content_moderator')
  );

CREATE POLICY "Authorized users can update events"
  ON public.events FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'event_manager')
    OR public.has_permission(auth.uid(), 'event_manager', id)
    OR public.has_permission(auth.uid(), 'content_moderator')
  );

CREATE POLICY "Authorized users can delete events"
  ON public.events FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'event_manager')
    OR public.has_permission(auth.uid(), 'content_moderator')
  );

-- Update clubs policies to allow club_managers and content_moderators
DROP POLICY IF EXISTS "Admins can insert clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON public.clubs;

CREATE POLICY "Authorized users can insert clubs"
  ON public.clubs FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'club_manager')
    OR public.has_permission(auth.uid(), 'content_moderator')
  );

CREATE POLICY "Authorized users can update clubs"
  ON public.clubs FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'club_manager')
    OR public.has_permission(auth.uid(), 'club_manager', id)
    OR public.has_permission(auth.uid(), 'content_moderator')
  );

CREATE POLICY "Authorized users can delete clubs"
  ON public.clubs FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'club_manager')
    OR public.has_permission(auth.uid(), 'content_moderator')
  );

-- Update club_memberships to allow club_managers
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.club_memberships;

CREATE POLICY "Authorized users can manage memberships"
  ON public.club_memberships FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'club_manager')
    OR public.has_permission(auth.uid(), 'club_manager', club_id)
  );

-- Update registrations to allow registration_managers to view all
CREATE POLICY "Registration managers can view all registrations"
  ON public.registrations FOR SELECT
  USING (public.has_permission(auth.uid(), 'registration_manager'));

-- Allow registration managers to update registrations (approve/reject)
CREATE POLICY "Registration managers can update registrations"
  ON public.registrations FOR UPDATE
  USING (public.has_permission(auth.uid(), 'registration_manager'));
