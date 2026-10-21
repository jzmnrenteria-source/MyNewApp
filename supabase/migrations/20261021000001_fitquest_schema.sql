-- FitQuest Phase 4 schema: accounts, gyms, owner listings, leads and saved shortlists.
-- Every table has row level security. Nobody can make themselves an admin through the API:
-- admins are listed in private.admin_emails, which only the database owner can write.

create schema if not exists private;

-- ── Admins ─────────────────────────────────────────────────────────────
-- Emails that get admin rights when they sign up (or immediately, if they already have).
-- Lives in a schema the API doesn't expose; filled in with SQL, never from the app.
create table private.admin_emails (
  email text primary key check (email = lower(email))
);

-- ── Profiles ───────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false)
$$;
-- anon may call it too (always false): the public gyms policy uses it.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Create a profile for every new account.
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    lower(new.email),
    exists (select 1 from private.admin_emails a where a.email = lower(new.email))
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accounts created before this migration get a profile too.
insert into public.profiles (id, email, is_admin)
select u.id, lower(u.email), exists (select 1 from private.admin_emails a where a.email = lower(u.email))
from auth.users u
where u.email is not null
on conflict (id) do nothing;

create policy "Users read their own profile; admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- No insert/update/delete policies: profiles are only written by the trigger above.

-- ── Gyms ───────────────────────────────────────────────────────────────
create table public.gyms (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (length(name) between 2 and 120),
  area text not null check (area in ('brickell','downtown','wynwood','midtown','coconut-grove','coral-gables','south-beach')),
  address text check (length(address) <= 200),
  type text not null check (length(type) <= 120),
  tier smallint not null check (tier between 1 and 4),
  goals_primary text[] not null default '{}',
  goals_secondary text[] not null default '{}',
  access text not null check (access in ('open','classes')),
  coached boolean not null default false,
  recovery boolean not null default false,
  community boolean not null default false,
  source text check (source ~ '^https://'),
  verified boolean not null default false,   -- details confirmed by FitQuest
  published boolean not null default true,
  owner_id uuid references auth.users (id) on delete set null,
  -- Details the gym owner can edit
  description text check (length(description) <= 1000),
  hours text check (length(hours) <= 300),
  price_note text check (length(price_note) <= 300),
  website text check (website ~ '^https://' and length(website) <= 300),
  phone text check (length(phone) <= 40),
  offers_day_pass boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gyms_owner_id_idx on public.gyms (owner_id);
alter table public.gyms enable row level security;

create policy "Anyone reads published gyms; owners and admins read their own/all"
  on public.gyms for select to anon, authenticated
  using (published or owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins add gyms"
  on public.gyms for insert to authenticated
  with check ((select public.is_admin()));
create policy "Owners update their gym; admins update any"
  on public.gyms for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins delete gyms"
  on public.gyms for delete to authenticated
  using ((select public.is_admin()));

-- Owners may only change their own details; everything else is admin-only.
create or replace function private.guard_gym_update()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    if (new.id, new.name, new.area, new.address, new.type, new.tier, new.goals_primary, new.goals_secondary,
        new.access, new.coached, new.recovery, new.community, new.source, new.verified, new.published, new.owner_id)
       is distinct from
       (old.id, old.name, old.area, old.address, old.type, old.tier, old.goals_primary, old.goals_secondary,
        old.access, old.coached, old.recovery, old.community, old.source, old.verified, old.published, old.owner_id)
    then
      raise exception 'Only admins can change this field' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_gym_update
  before update on public.gyms
  for each row execute function private.guard_gym_update();

-- ── Owner requests (claim a listed gym, or ask to add a new one) ───────
create table public.owner_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gym_id text references public.gyms (id) on delete cascade,   -- null = gym not listed yet
  gym_name text check (length(gym_name) <= 120),
  gym_address text check (length(gym_address) <= 200),
  role text not null check (length(role) between 2 and 80),
  message text check (length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (gym_id is not null or gym_name is not null)
);
create index owner_requests_user_id_idx on public.owner_requests (user_id);
create index owner_requests_gym_id_idx on public.owner_requests (gym_id);
alter table public.owner_requests enable row level security;

create policy "Users create their own pending requests"
  on public.owner_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and decided_at is null);
create policy "Users read their own requests; admins read all"
  on public.owner_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins decide requests"
  on public.owner_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Approve or reject a request in one step. Approving a claim makes the requester the gym's owner.
create or replace function public.decide_owner_request(request_id uuid, approve boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.owner_requests;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select * into r from public.owner_requests where id = request_id and status = 'pending' for update;
  if not found then
    raise exception 'Request not found or already decided';
  end if;
  update public.owner_requests
    set status = case when approve then 'approved' else 'rejected' end, decided_at = now()
    where id = request_id;
  if approve and r.gym_id is not null then
    update public.gyms set owner_id = r.user_id where id = r.gym_id;
  end if;
end;
$$;
revoke execute on function public.decide_owner_request(uuid, boolean) from public, anon;
grant execute on function public.decide_owner_request(uuid, boolean) to authenticated;

-- ── Leads (a visitor contacts a gym) ───────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  gym_id text not null references public.gyms (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('day_pass','question')),
  name text not null check (length(name) between 1 and 80),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  message text check (length(message) <= 1000),
  created_at timestamptz not null default now()
);
create index leads_gym_id_idx on public.leads (gym_id);
create index leads_user_id_idx on public.leads (user_id);
alter table public.leads enable row level security;

create policy "Signed-in users send leads to published gyms"
  on public.leads for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.gyms g where g.id = gym_id and g.published)
  );
create policy "Senders, the gym's owner and admins read leads"
  on public.leads for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or exists (select 1 from public.gyms g where g.id = gym_id and g.owner_id = (select auth.uid()))
  );
create policy "Admins delete leads"
  on public.leads for delete to authenticated
  using ((select public.is_admin()));

-- Limit each account to 10 leads a day, to keep spam down.
create or replace function private.limit_leads()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.leads where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Daily message limit reached. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger limit_leads
  before insert on public.leads
  for each row execute function private.limit_leads();

-- ── Saved shortlists ───────────────────────────────────────────────────
create table public.saved_gyms (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gym_id text not null references public.gyms (id) on delete cascade,
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (user_id, gym_id)
);
create index saved_gyms_gym_id_idx on public.saved_gyms (gym_id);
alter table public.saved_gyms enable row level security;

create policy "Users manage their own saved gyms"
  on public.saved_gyms for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Private schema functions are only called by triggers.
revoke all on schema private from public, anon, authenticated;
