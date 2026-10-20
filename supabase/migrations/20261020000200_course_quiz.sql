-- Prova final do curso: quiz, questões e tentativas.
-- Escritas apenas via service_role (server actions Next.js).

create table public.course_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  pass_ratio numeric(3, 2) not null default 0.70
    check (pass_ratio > 0 and pass_ratio <= 1),
  max_attempts integer not null default 3
    check (max_attempts between 1 and 20),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_quizzes_course_key unique (course_id)
);

create trigger course_quizzes_set_updated_at
before update on public.course_quizzes
for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.course_quizzes (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_quiz_position_key unique (quiz_id, position),
  constraint quiz_questions_options_array check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  constraint quiz_questions_correct_in_range check (correct_index < jsonb_array_length(options))
);

create index quiz_questions_quiz_idx on public.quiz_questions (quiz_id, position);

create trigger quiz_questions_set_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.course_quizzes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score_percent integer not null default 0 check (score_percent between 0 and 100),
  passed boolean not null default false,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint quiz_attempts_answers_object check (jsonb_typeof(answers) = 'object')
);

create index quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id, submitted_at desc);

alter table public.course_quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy course_quizzes_select_published on public.course_quizzes
  for select to authenticated
  using (
    is_published
    and exists (select 1 from public.courses c where c.id = course_id and c.is_published)
  );

-- Aluno autenticado pode ler enunciado/opções de provas publicadas, nunca o gabarito via grant parcial.
create policy quiz_questions_select_published on public.quiz_questions
  for select to authenticated
  using (
    exists (
      select 1 from public.course_quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_id and q.is_published and c.is_published
    )
  );

create policy quiz_attempts_select_own on public.quiz_attempts
  for select to authenticated
  using (user_id = (select public.current_profile_id()));

revoke all on public.course_quizzes from anon, authenticated;
revoke all on public.quiz_questions from anon, authenticated;
revoke all on public.quiz_attempts from anon, authenticated;

grant select on public.course_quizzes to authenticated;
grant select (
  id, quiz_id, module_id, prompt, options, position, created_at, updated_at
) on public.quiz_questions to authenticated;
grant select on public.quiz_attempts to authenticated;
