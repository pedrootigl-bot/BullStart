-- Bull Academy — esquema principal
-- Tabelas de catálogo (cursos, módulos, aulas), progresso, elegibilidade, certificados e auditoria.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('student', 'admin');

create type public.requirement_type as enum (
  'FREE',
  'PREVIOUS_MODULE',
  'BROKER_ELIGIBILITY',
  'MANUAL',
  'COMBINED'
);

create type public.module_access_status as enum ('granted', 'revoked');

create type public.lesson_progress_status as enum ('in_progress', 'completed');

create type public.eligibility_status as enum ('eligible', 'not_eligible', 'pending');

create type public.eligibility_source as enum ('webhook', 'api', 'mock');

create type public.video_provider as enum ('supabase_storage', 'external_url');

create type public.broker_event_status as enum ('processing', 'processed', 'ignored', 'failed');

-- ---------------------------------------------------------------------------
-- Utilitário: updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  broker_user_id text unique check (broker_user_id is null or char_length(broker_user_id) between 1 and 128),
  full_name text not null default '' check (char_length(full_name) <= 120),
  email extensions.citext not null,
  role public.app_role not null default 'student',
  broker_account_status text check (broker_account_status is null or char_length(broker_account_status) <= 40),
  broker_verification_status text check (broker_verification_status is null or char_length(broker_verification_status) <= 40),
  broker_registered_at timestamptz,
  broker_linked_at timestamptz,
  broker_last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);
create index profiles_full_name_idx on public.profiles (lower(full_name));

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente quando um usuário é criado no Supabase Auth.
-- O papel é sempre 'student'; promoção a admin só via operação privilegiada.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (auth_user_id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120)
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where auth_user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.handle_auth_user_email_change();

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  thumbnail_url text,
  is_published boolean not null default false,
  workload_hours integer not null default 0 check (workload_hours between 0 and 1000),
  completion_min_watch_ratio numeric(3, 2) not null default 0.80
    check (completion_min_watch_ratio > 0 and completion_min_watch_ratio <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- modules
-- ---------------------------------------------------------------------------
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  topics text[] not null default '{}' check (cardinality(topics) <= 12),
  position integer not null check (position > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_course_position_key unique (course_id, position) deferrable initially immediate
);

create index modules_course_idx on public.modules (course_id, position);

create trigger modules_set_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '' check (char_length(description) <= 4000),
  objectives text[] not null default '{}' check (cardinality(objectives) <= 12),
  topics text[] not null default '{}' check (cardinality(topics) <= 12),
  materials jsonb not null default '[]'::jsonb check (jsonb_typeof(materials) = 'array'),
  thumbnail_url text,
  video_provider public.video_provider not null default 'supabase_storage',
  video_asset_id text check (video_asset_id is null or char_length(video_asset_id) <= 1024),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  position integer not null check (position > 0),
  is_required boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_module_position_key unique (module_id, position) deferrable initially immediate
);

create index lessons_module_idx on public.lessons (module_id, position);

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- module_requirements
-- config_json é validado no servidor por schema Zod versionado (campo "version").
-- ---------------------------------------------------------------------------
create table public.module_requirements (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  requirement_type public.requirement_type not null,
  config_json jsonb not null default '{"version": 1}'::jsonb
    check (jsonb_typeof(config_json) = 'object' and (config_json ? 'version')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index module_requirements_module_idx on public.module_requirements (module_id);

create trigger module_requirements_set_updated_at
before update on public.module_requirements
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- module_access — liberações manuais registradas por administradores
-- ---------------------------------------------------------------------------
create table public.module_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  status public.module_access_status not null,
  source text not null default 'MANUAL' check (source in ('MANUAL')),
  reason text not null check (char_length(reason) between 5 and 500),
  granted_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_access_user_module_key unique (user_id, module_id)
);

create index module_access_module_idx on public.module_access (module_id);

create trigger module_access_set_updated_at
before update on public.module_access
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  status public.lesson_progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_heartbeat_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_user_lesson_key unique (user_id, lesson_id),
  constraint lesson_progress_completed_consistency
    check ((status = 'completed') = (completed_at is not null))
);

create index lesson_progress_user_idx on public.lesson_progress (user_id, updated_at desc);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

create trigger lesson_progress_set_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- broker_eligibility — apenas o status confirmado; nenhum valor financeiro.
-- ---------------------------------------------------------------------------
create table public.broker_eligibility (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  requirement_key text not null check (requirement_key ~ '^[a-z0-9_]{3,64}$'),
  eligibility_status public.eligibility_status not null,
  source public.eligibility_source not null,
  source_event_id text check (source_event_id is null or char_length(source_event_id) <= 200),
  checked_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint broker_eligibility_user_key unique (user_id, requirement_key)
);

-- ---------------------------------------------------------------------------
-- broker_events — idempotência e proteção contra replay de webhooks
-- ---------------------------------------------------------------------------
create table public.broker_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique check (char_length(event_id) between 1 and 200),
  event_type text not null check (char_length(event_type) <= 80),
  occurred_at timestamptz,
  payload_sha256 text not null,
  status public.broker_event_status not null default 'processing',
  result text check (result is null or char_length(result) <= 500),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index broker_events_received_idx on public.broker_events (received_at desc);

-- ---------------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  verification_code text not null unique check (verification_code ~ '^BXS-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$'),
  holder_name text not null check (char_length(holder_name) between 1 and 120),
  workload_hours integer not null check (workload_hours >= 0),
  completed_at timestamptz not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text check (revoked_reason is null or char_length(revoked_reason) <= 500)
);

create unique index certificates_active_unique_idx
  on public.certificates (user_id, course_id)
  where revoked_at is null;

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  entity_type text not null check (char_length(entity_type) <= 60),
  entity_id text check (entity_id is null or char_length(entity_id) <= 200),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id);

-- ---------------------------------------------------------------------------
-- rate_limits — janela fixa, consumida apenas pelo backend (service_role)
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key text primary key check (char_length(key) <= 200),
  window_start timestamptz not null,
  hits integer not null
);
