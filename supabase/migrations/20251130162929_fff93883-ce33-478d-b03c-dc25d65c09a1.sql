-- Phase 5: Clean up orphaned storage policies for archived tables
-- The task-attachments bucket was used by the archived tasks/projects module
-- Drop all policies that might exist for task-attachments

-- Drop all possible policies on the task-attachments bucket
DROP POLICY IF EXISTS "Users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task owners can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task owners can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task owners can delete attachments" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage task attachments" ON storage.objects;

-- Note: The task-attachments bucket itself is kept in case there are existing files
-- To view buckets: SELECT * FROM storage.buckets;
-- To remove the bucket completely (if no longer needed):
-- DELETE FROM storage.buckets WHERE id = 'task-attachments';