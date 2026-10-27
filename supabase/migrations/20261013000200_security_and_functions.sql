-- Bull Academy — RLS, privilégios e funções de domínio
--
-- Modelo de segurança:
--   * O navegador nunca fala direto com o banco; o servidor Next.js usa o JWT do aluno (RLS)
--     para leituras e a service_role apenas em rotas server-side já autorizadas.
--   * anon/authenticated não possuem INSERT/UPDATE/DELETE em nenhuma tabela.
--   * Escritas sensíveis (progresso, elegibilidade, certificados) passam por funções
--     executáveis somente pela service_role.

-- ---------------------------------------------------------------------------
-- Helper: perfil do usuário autenticado
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.module_requirements enable row level security;
alter table public.module_access enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.broker_eligibility enable row level security;
alter table public.broker_events enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limits enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy courses_select_published on public.courses
  for select to authenticated
  using (is_published);

create policy modules_select_published on public.modules
  for select to authenticated
  using (
    is_published
    and exists (select 1 from public.courses c where c.id = course_id and c.is_published)
  );

create policy lessons_select_published on public.lessons
  for select to authenticated
  using (
    is_published
    and exists (select 1 from public.modules m where m.id = module_id and m.is_published)
  );

create policy module_requirements_select_published on public.module_requirements
  for select to authenticated
  using (exists (select 1 from public.modules m where m.id = module_id and m.is_published));

create policy module_access_select_own on public.module_access
  for select to authenticated
  using (user_id = (select public.current_profile_id()));

create policy lesson_progress_select_own on public.lesson_progress
  for select to authenticated
  using (user_id = (select public.current_profile_id()));

create policy broker_eligibility_select_own on public.broker_eligibility
  for select to authenticated
  using (user_id = (select public.current_profile_id()));

create policy certificates_select_own on public.certificates
  for select to authenticated
  using (user_id = (select public.current_profile_id()));

-- broker_events, audit_logs e rate_limits: sem políticas => inacessíveis para anon/authenticated.

-- ---------------------------------------------------------------------------
-- Privilégios de tabela (defesa em profundidade além do RLS)
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.courses to authenticated;
grant select on public.modules to authenticated;
grant select on public.module_requirements to authenticated;
grant select on public.module_access to authenticated;
grant select on public.lesson_progress to authenticated;
grant select on public.broker_eligibility to authenticated;
grant select on public.certificates to authenticated;

-- A referência do vídeo (video_provider/video_asset_id) nunca é legível pelo aluno.
grant select (
  id, module_id, title, description, objectives, topics, materials, thumbnail_url,
  duration_seconds, position, is_required, is_published, created_at, updated_at
) on public.lessons to authenticated;

-- ---------------------------------------------------------------------------
-- Catálogo público (landing page)
-- ---------------------------------------------------------------------------
create or replace function public.public_catalog(p_course_slug text)
returns table (
  module_id uuid,
  slug text,
  title text,
  description text,
  topics text[],
  "position" integer,
  lesson_count bigint,
  total_duration_seconds bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.slug,
    m.title,
    m.description,
    m.topics,
    m.position,
    count(l.id),
    coalesce(sum(l.duration_seconds), 0)
  from public.modules m
  join public.courses c on c.id = m.course_id and c.is_published and c.slug = p_course_slug
  left join public.lessons l on l.module_id = m.id and l.is_published
  where m.is_published
  group by m.id
  order by m.position;
$$;

-- ---------------------------------------------------------------------------
-- Verificação pública de certificado (sem expor dados privados)
-- ---------------------------------------------------------------------------
create or replace function public.verify_certificate(p_code text)
returns table (
  holder_name text,
  course_title text,
  workload_hours integer,
  completed_at timestamptz,
  issued_at timestamptz,
  is_revoked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when position(' ' in trim(ce.holder_name)) = 0 then trim(ce.holder_name)
      else split_part(trim(ce.holder_name), ' ', 1) || ' '
        || left(regexp_replace(trim(ce.holder_name), '^.*\s', ''), 1) || '.'
    end,
    co.title,
    ce.workload_hours,
    ce.completed_at,
    ce.issued_at,
    ce.revoked_at is not null
  from public.certificates ce
  join public.courses co on co.id = ce.course_id
  where ce.verification_code = upper(trim(p_code))
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting (janela fixa)
-- ---------------------------------------------------------------------------
create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.hits + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Progresso: heartbeat de reprodução
-- O crédito de tempo assistido é limitado pelo tempo de relógio decorrido no
-- servidor desde o último heartbeat, impedindo que o cliente "acelere" o progresso.
-- ---------------------------------------------------------------------------
create or replace function public.apply_lesson_heartbeat(
  p_user_id uuid,
  p_lesson_id uuid,
  p_position integer,
  p_claimed_seconds integer
)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duration integer;
  v_row public.lesson_progress;
  v_elapsed numeric;
  v_credit integer;
begin
  select l.duration_seconds into v_duration from public.lessons l where l.id = p_lesson_id;
  if v_duration is null then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  insert into public.lesson_progress (user_id, lesson_id, last_heartbeat_at)
  values (p_user_id, p_lesson_id, now())
  on conflict (user_id, lesson_id) do nothing;

  select * into v_row
  from public.lesson_progress lp
  where lp.user_id = p_user_id and lp.lesson_id = p_lesson_id
  for update;

  v_elapsed := extract(epoch from (now() - v_row.last_heartbeat_at));
  v_credit := least(greatest(coalesce(p_claimed_seconds, 0), 0), ceil(v_elapsed)::integer + 2, 120);

  update public.lesson_progress lp
  set watched_seconds = least(lp.watched_seconds + v_credit, v_duration),
      last_position_seconds = least(greatest(coalesce(p_position, 0), 0), v_duration),
      last_heartbeat_at = now()
  where lp.id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Progresso: conclusão explícita, validada pela política do curso
-- ---------------------------------------------------------------------------
create or replace function public.complete_lesson(p_user_id uuid, p_lesson_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duration integer;
  v_ratio numeric;
  v_required integer;
  v_row public.lesson_progress;
begin
  select l.duration_seconds, c.completion_min_watch_ratio
    into v_duration, v_ratio
  from public.lessons l
  join public.modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  where l.id = p_lesson_id;

  if v_duration is null then
    return jsonb_build_object('ok', false, 'reason', 'lesson_not_found');
  end if;

  v_required := floor(v_duration * v_ratio)::integer;

  select * into v_row
  from public.lesson_progress lp
  where lp.user_id = p_user_id and lp.lesson_id = p_lesson_id
  for update;

  if not found then
    if v_required > 0 then
      return jsonb_build_object('ok', false, 'reason', 'not_started', 'required_seconds', v_required, 'watched_seconds', 0);
    end if;
    insert into public.lesson_progress (user_id, lesson_id, status, completed_at)
    values (p_user_id, p_lesson_id, 'completed', now());
    return jsonb_build_object('ok', true, 'already', false);
  end if;

  if v_row.status = 'completed' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  if v_row.watched_seconds < v_required then
    return jsonb_build_object(
      'ok', false,
      'reason', 'insufficient_watch',
      'required_seconds', v_required,
      'watched_seconds', v_row.watched_seconds
    );
  end if;

  update public.lesson_progress lp
  set status = 'completed', completed_at = now()
  where lp.id = v_row.id;

  return jsonb_build_object('ok', true, 'already', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Ordenação (troca atômica de posição com constraint deferida)
-- ---------------------------------------------------------------------------
create or replace function public.move_module(p_module_id uuid, p_direction integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.modules;
  v_neighbor public.modules;
begin
  select * into v_current from public.modules where id = p_module_id for update;
  if not found then return false; end if;

  if p_direction < 0 then
    select * into v_neighbor from public.modules
    where course_id = v_current.course_id and position < v_current.position
    order by position desc limit 1 for update;
  else
    select * into v_neighbor from public.modules
    where course_id = v_current.course_id and position > v_current.position
    order by position asc limit 1 for update;
  end if;

  if not found then return false; end if;

  set constraints public.modules_course_position_key deferred;
  update public.modules set position = v_neighbor.position where id = v_current.id;
  update public.modules set position = v_current.position where id = v_neighbor.id;
  return true;
end;
$$;

create or replace function public.move_lesson(p_lesson_id uuid, p_direction integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.lessons;
  v_neighbor public.lessons;
begin
  select * into v_current from public.lessons where id = p_lesson_id for update;
  if not found then return false; end if;

  if p_direction < 0 then
    select * into v_neighbor from public.lessons
    where module_id = v_current.module_id and position < v_current.position
    order by position desc limit 1 for update;
  else
    select * into v_neighbor from public.lessons
    where module_id = v_current.module_id and position > v_current.position
    order by position asc limit 1 for update;
  end if;

  if not found then return false; end if;

  set constraints public.lessons_module_position_key deferred;
  update public.lessons set position = v_neighbor.position where id = v_current.id;
  update public.lessons set position = v_current.position where id = v_neighbor.id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privilégios de funções
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.public_catalog(text) to anon, authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.apply_lesson_heartbeat(uuid, uuid, integer, integer) to service_role;
grant execute on function public.complete_lesson(uuid, uuid) to service_role;
grant execute on function public.move_module(uuid, integer) to service_role;
grant execute on function public.move_lesson(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado de vídeos (acesso somente via URL assinada temporária)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-videos', 'lesson-videos', false, 524288000, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;
