-- GHAR KA KHANA: run this whole file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null check (price > 0),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner')),
  emoji text default '🍱',
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  meal_time text,
  note text default '',
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null default 'cash_on_delivery' check (payment_method in ('cash_on_delivery','upi_on_delivery')),
  status text not null default 'new' check (status in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity between 1 and 50)
);

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public may read available menu only. Authenticated owner can manage menu.
drop policy if exists "Public reads available menu" on public.menu_items;
create policy "Public reads available menu" on public.menu_items for select to anon, authenticated using (is_available = true or auth.role() = 'authenticated');
drop policy if exists "Owner manages menu" on public.menu_items;
create policy "Owner manages menu" on public.menu_items for all to authenticated using (true) with check (true);

-- Orders and order items are private. The Edge Function uses service role securely.
drop policy if exists "Owner reads orders" on public.orders;
create policy "Owner reads orders" on public.orders for select to authenticated using (true);
drop policy if exists "Owner updates orders" on public.orders;
create policy "Owner updates orders" on public.orders for update to authenticated using (true) with check (true);
drop policy if exists "Owner reads order items" on public.order_items;
create policy "Owner reads order items" on public.order_items for select to authenticated using (true);

grant select on public.menu_items to anon, authenticated;
grant all on public.menu_items to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

insert into public.menu_items(name,description,price,meal_type,emoji,sort_order) values
('लिट्टी-चोखा','बिहार का मशहूर देसी स्वाद',60,'lunch','🥘',1),
('दाल-भात-आलू भुजिया','सादा, स्वादिष्ट और पेट भर भोजन',80,'lunch','🍛',2),
('रोटी-सब्ज़ी-दाल','घर जैसा रोज़ का खाना',90,'dinner','🍲',3),
('चूड़ा-दही','हल्का और स्वादिष्ट बिहारी नाश्ता',40,'breakfast','🥣',4),
('सत्तू पराठा','देसी सत्तू से बना भरपेट नाश्ता',50,'breakfast','🫓',5),
('पूड़ी-सब्ज़ी','गरमा-गरम नाश्ता या भोजन',60,'breakfast','🍽️',6)
on conflict do nothing;
-- If you already created the database before this update, run this safe migration too.
alter table public.orders add column if not exists payment_method text not null default 'cash_on_delivery';
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check check (payment_method in ('cash_on_delivery','upi_on_delivery'));
