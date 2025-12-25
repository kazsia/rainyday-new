-- 20251225_add_custom_fields.sql
-- Add custom fields to products and orders

-- 1. Add custom_fields to products table to store field definitions
alter table public.products add column if not exists custom_fields jsonb;

-- 2. Add custom_fields to orders table to store user-provided values
alter table public.orders add column if not exists custom_fields jsonb;
