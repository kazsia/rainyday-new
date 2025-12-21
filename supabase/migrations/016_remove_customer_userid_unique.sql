-- 016_remove_customer_userid_unique.sql
-- Remove the unique constraint on user_id that prevents multiple emails 
-- from being associated with a single user account.

-- 1. DROP THE UNIQUE INDEX/CONSTRAINT
-- Based on the error details, the index name is idx_customers_user_id_unique
drop index if exists public.idx_customers_user_id_unique;

-- 2. ENSURE A REGULAR INDEX EXISTS FOR PERFORMANCE
create index if not exists idx_customers_user_id on public.customers(user_id);

-- 3. ENSURE EMAIL IS STILL UNIQUE (it should be, but just in case)
-- alter table public.customers add constraint customers_email_key unique (email);
