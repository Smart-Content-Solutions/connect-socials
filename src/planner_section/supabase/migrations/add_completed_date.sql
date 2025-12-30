-- Migration: Add completed_date column to tasks table
-- This column tracks when a task was marked as completed
-- Run this in your Supabase SQL editor or via migration tool

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Add a comment to the column for documentation
COMMENT ON COLUMN tasks.completed_date IS 'Date when the task was marked as completed';
