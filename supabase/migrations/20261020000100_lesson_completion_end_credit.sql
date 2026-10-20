-- Ao chegar perto do fim do vídeo, credita o tempo restante para a conclusão
-- não ficar bloqueada por subcontagem do heartbeat ou pequenos desvios de duração.
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
  v_position integer;
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

  v_position := least(greatest(coalesce(p_position, 0), 0), v_duration);
  v_elapsed := extract(epoch from (now() - v_row.last_heartbeat_at));
  v_credit := least(greatest(coalesce(p_claimed_seconds, 0), 0), ceil(v_elapsed)::integer + 2, 120);

  -- Fim do vídeo (ou últimos 2s): garante crédito integral para liberar a conclusão.
  if v_duration > 0 and v_position >= greatest(v_duration - 2, 0) then
    v_credit := greatest(v_credit, v_duration - v_row.watched_seconds);
  end if;

  update public.lesson_progress lp
  set watched_seconds = least(lp.watched_seconds + v_credit, v_duration),
      last_position_seconds = v_position,
      last_heartbeat_at = now()
  where lp.id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

-- Conclusão também aceita quem alcançou 80% da timeline do vídeo.
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

  if v_row.watched_seconds < v_required and v_row.last_position_seconds < v_required then
    return jsonb_build_object(
      'ok', false,
      'reason', 'insufficient_watch',
      'required_seconds', v_required,
      'watched_seconds', v_row.watched_seconds
    );
  end if;

  update public.lesson_progress lp
  set status = 'completed',
      completed_at = now(),
      watched_seconds = greatest(lp.watched_seconds, v_required)
  where lp.id = v_row.id;

  return jsonb_build_object('ok', true, 'already', false);
end;
$$;
