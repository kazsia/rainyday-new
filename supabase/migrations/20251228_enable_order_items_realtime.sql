-- Enable realtime for order_items table
do $$ begin
    alter publication supabase_realtime add table public.order_items;
exception when others then null; end $$;
