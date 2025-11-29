-- Add 'client' role to app_role enum for Büeze
-- This allows explicit client role assignment while maintaining backward compatibility with 'user'
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client';