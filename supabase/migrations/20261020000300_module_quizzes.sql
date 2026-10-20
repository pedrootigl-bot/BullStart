-- Provas por módulo: um quiz publicado por módulo (unique module_id).
-- Escritas continuam via service_role (server actions).

-- Remove o modelo antigo (1 quiz por curso) para reseed por módulo.
delete from public.quiz_attempts;
delete from public.quiz_questions;
delete from public.course_quizzes;

alter table public.course_quizzes
  drop constraint if exists course_quizzes_course_key;

alter table public.course_quizzes
  add column if not exists module_id uuid references public.modules (id) on delete cascade;

alter table public.course_quizzes
  alter column module_id set not null;

alter table public.course_quizzes
  drop constraint if exists course_quizzes_module_key;

alter table public.course_quizzes
  add constraint course_quizzes_module_key unique (module_id);

create index if not exists course_quizzes_course_idx on public.course_quizzes (course_id);
