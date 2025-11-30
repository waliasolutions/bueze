-- CRITICAL SECURITY FIX: Remove all dangerous RLS policies that allow unrestricted access
-- Phase 1: Remove "Anyone can..." policies from projects, tasks, and task_media

-- Remove all permissive policies on projects table (orphaned HR/Trucking module)
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.projects;

-- Remove all permissive policies on tasks table (orphaned HR/Trucking module)
DROP POLICY IF EXISTS "Anyone can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.tasks;

-- Remove all permissive policies on task_media table (orphaned HR/Trucking module)
DROP POLICY IF EXISTS "Anyone can view task_media" ON public.task_media;
DROP POLICY IF EXISTS "Anyone can insert task_media" ON public.task_media;
DROP POLICY IF EXISTS "Anyone can update task_media" ON public.task_media;
DROP POLICY IF EXISTS "Anyone can delete task_media" ON public.task_media;