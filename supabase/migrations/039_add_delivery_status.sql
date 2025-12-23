-- Add status column to deliveries table
alter table public.deliveries 
add column if not exists status text not null default 'pending' check (status in ('pending', 'delivered', 'failed'));

-- Add index for status
create index if not exists idx_deliveries_status on public.deliveries(status);

-- Force cache reload
NOTIFY pgrst, 'reload config';
