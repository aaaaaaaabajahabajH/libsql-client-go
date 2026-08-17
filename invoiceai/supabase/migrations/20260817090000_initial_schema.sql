-- InvoiceAI initial schema.
-- Tables: profiles, companies, customers, invoices, invoice_items, quotes,
-- quote_items, subscriptions, usage. Every table is scoped to auth.uid()
-- via RLS so a user can only ever see their own rows.

-- =========================================================================
-- Enums
-- =========================================================================

create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type public.plan_id as enum ('free', 'starter', 'pro');

-- =========================================================================
-- Helper: updated_at maintenance
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Tables
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  language text not null default 'ar' check (language in ('ar', 'en')),
  currency text not null default 'AED',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  logo_url text,
  email text,
  phone text,
  address text,
  tax_number text,
  default_currency text not null default 'AED',
  default_tax_rate numeric(5, 2) not null default 0,
  payment_terms text,
  invoice_prefix text not null default 'INV',
  quote_prefix text not null default 'QUO',
  invoice_seq integer not null default 0,
  quote_seq integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company_name text,
  address text,
  tax_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  invoice_number text,
  status public.invoice_status not null default 'draft',
  currency text not null default 'AED',
  issue_date date not null default current_date,
  due_date date,
  tax_rate numeric(5, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  payment_terms text,
  share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null default 0,
  name text not null,
  description text,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  quote_number text,
  status public.quote_status not null default 'draft',
  currency text not null default 'AED',
  issue_date date not null default current_date,
  expiry_date date,
  tax_rate numeric(5, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  share_token uuid not null default gen_random_uuid(),
  converted_invoice_id uuid references public.invoices (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quote_number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null default 0,
  name text not null,
  description text,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan public.plan_id not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null,
  invoices_created integer not null default 0,
  ai_requests integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

-- =========================================================================
-- Indexes
-- =========================================================================

create index customers_user_id_idx on public.customers (user_id);
create index customers_user_id_name_idx on public.customers (user_id, name);

create index invoices_user_id_idx on public.invoices (user_id);
create index invoices_customer_id_idx on public.invoices (customer_id);
create index invoices_user_id_status_idx on public.invoices (user_id, status);
create unique index invoices_share_token_idx on public.invoices (share_token);

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index invoice_items_user_id_idx on public.invoice_items (user_id);

create index quotes_user_id_idx on public.quotes (user_id);
create index quotes_customer_id_idx on public.quotes (customer_id);
create index quotes_user_id_status_idx on public.quotes (user_id, status);
create unique index quotes_share_token_idx on public.quotes (share_token);

create index quote_items_quote_id_idx on public.quote_items (quote_id);
create index quote_items_user_id_idx on public.quote_items (user_id);

create unique index subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id) where stripe_customer_id is not null;
create unique index subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;

create index usage_user_id_idx on public.usage (user_id);

-- =========================================================================
-- updated_at triggers
-- =========================================================================

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger usage_set_updated_at before update on public.usage
  for each row execute function public.set_updated_at();

-- =========================================================================
-- New-user bootstrap: profile + free-plan subscription row
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- invoice_items / quote_items: derive user_id from the parent row so a
-- client can never write a line item into someone else's document.
-- =========================================================================

create or replace function public.set_invoice_item_user_id()
returns trigger
language plpgsql
as $$
begin
  select user_id into new.user_id from public.invoices where id = new.invoice_id;
  if new.user_id is null then
    raise exception 'Invalid invoice_id: %', new.invoice_id;
  end if;
  return new;
end;
$$;

create trigger invoice_items_set_user_id before insert on public.invoice_items
  for each row execute function public.set_invoice_item_user_id();

create or replace function public.set_quote_item_user_id()
returns trigger
language plpgsql
as $$
begin
  select user_id into new.user_id from public.quotes where id = new.quote_id;
  if new.user_id is null then
    raise exception 'Invalid quote_id: %', new.quote_id;
  end if;
  return new;
end;
$$;

create trigger quote_items_set_user_id before insert on public.quote_items
  for each row execute function public.set_quote_item_user_id();

-- =========================================================================
-- Plan-limit enforcement (defense in depth — the app should check and
-- surface a friendly upgrade prompt before ever reaching this trigger).
-- Named with a numeric prefix so it fires before invoices_10_set_number.
-- =========================================================================

create or replace function public.enforce_invoice_limit()
returns trigger
language plpgsql
as $$
declare
  v_plan public.plan_id;
  v_limit integer;
  v_count integer;
begin
  select plan into v_plan from public.subscriptions where user_id = new.user_id;

  v_limit := case v_plan
    when 'free' then 5
    when 'starter' then 100
    else null -- pro: unlimited
  end;

  if v_limit is not null then
    select coalesce(invoices_created, 0) into v_count
      from public.usage
      where user_id = new.user_id and month = date_trunc('month', now())::date;

    if coalesce(v_count, 0) >= v_limit then
      raise exception 'monthly invoice limit reached for plan %: % invoices', v_plan, v_limit
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger invoices_00_enforce_limit before insert on public.invoices
  for each row execute function public.enforce_invoice_limit();

-- =========================================================================
-- Auto invoice/quote numbering (atomic per-company sequence)
-- =========================================================================

create or replace function public.set_invoice_number()
returns trigger
language plpgsql
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  if new.invoice_number is null or new.invoice_number = '' then
    update public.companies
      set invoice_seq = invoice_seq + 1
      where user_id = new.user_id
      returning invoice_seq, invoice_prefix into v_seq, v_prefix;

    if v_seq is null then
      raise exception 'cannot auto-generate invoice number: no company profile for user %', new.user_id;
    end if;

    new.invoice_number := coalesce(v_prefix, 'INV') || '-' || lpad(v_seq::text, 6, '0');
  end if;

  return new;
end;
$$;

create trigger invoices_10_set_number before insert on public.invoices
  for each row execute function public.set_invoice_number();

create or replace function public.set_quote_number()
returns trigger
language plpgsql
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  if new.quote_number is null or new.quote_number = '' then
    update public.companies
      set quote_seq = quote_seq + 1
      where user_id = new.user_id
      returning quote_seq, quote_prefix into v_seq, v_prefix;

    if v_seq is null then
      raise exception 'cannot auto-generate quote number: no company profile for user %', new.user_id;
    end if;

    new.quote_number := coalesce(v_prefix, 'QUO') || '-' || lpad(v_seq::text, 6, '0');
  end if;

  return new;
end;
$$;

create trigger quotes_10_set_number before insert on public.quotes
  for each row execute function public.set_quote_number();

-- =========================================================================
-- Usage tracking: count every invoice creation towards the monthly limit
-- =========================================================================

create or replace function public.increment_invoice_usage()
returns trigger
language plpgsql
as $$
begin
  insert into public.usage (user_id, month, invoices_created)
  values (new.user_id, date_trunc('month', now())::date, 1)
  on conflict (user_id, month)
  do update set invoices_created = public.usage.invoices_created + 1, updated_at = now();

  return new;
end;
$$;

create trigger invoices_20_increment_usage after insert on public.invoices
  for each row execute function public.increment_invoice_usage();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;

create policy "profiles_owner_access" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "companies_owner_access" on public.companies
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "customers_owner_access" on public.customers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "invoices_owner_access" on public.invoices
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "invoice_items_owner_access" on public.invoice_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "quotes_owner_access" on public.quotes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "quote_items_owner_access" on public.quote_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "subscriptions_owner_access" on public.subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "usage_owner_access" on public.usage
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================================
-- Public share links: SECURITY DEFINER RPCs gated by an unguessable
-- share_token, instead of relaxing RLS. RLS above stays owner-only.
-- =========================================================================

create or replace function public.get_shared_invoice(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'invoice', to_jsonb(i) - 'user_id',
    'items', coalesce((
      select jsonb_agg(to_jsonb(ii) - 'user_id' order by ii.position)
      from public.invoice_items ii
      where ii.invoice_id = i.id
    ), '[]'::jsonb),
    'customer', to_jsonb(c) - 'user_id',
    'company', to_jsonb(co) - 'user_id'
  )
  into v_result
  from public.invoices i
  join public.customers c on c.id = i.customer_id
  join public.companies co on co.user_id = i.user_id
  where i.share_token = p_token;

  return v_result;
end;
$$;

revoke all on function public.get_shared_invoice(uuid) from public;
grant execute on function public.get_shared_invoice(uuid) to anon, authenticated;

create or replace function public.get_shared_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'quote', to_jsonb(q) - 'user_id',
    'items', coalesce((
      select jsonb_agg(to_jsonb(qi) - 'user_id' order by qi.position)
      from public.quote_items qi
      where qi.quote_id = q.id
    ), '[]'::jsonb),
    'customer', to_jsonb(c) - 'user_id',
    'company', to_jsonb(co) - 'user_id'
  )
  into v_result
  from public.quotes q
  join public.customers c on c.id = q.customer_id
  join public.companies co on co.user_id = q.user_id
  where q.share_token = p_token;

  return v_result;
end;
$$;

revoke all on function public.get_shared_quote(uuid) from public;
grant execute on function public.get_shared_quote(uuid) to anon, authenticated;
