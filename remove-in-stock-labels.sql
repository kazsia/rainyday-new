-- Script to remove "In Stock!" labels from database
-- Run this in your Supabase SQL Editor or use the admin script below

-- SQL Query (run in Supabase Dashboard):
UPDATE products 
SET status_label = NULL, status_color = NULL
WHERE status_label = 'In Stock!' OR status_label = 'In Stock';
