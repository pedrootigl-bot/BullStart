-- Imagem opcional de contexto nas questões da prova
alter table public.quiz_questions
  add column if not exists image_url text;

revoke all on public.quiz_questions from anon, authenticated;

grant select (
  id, quiz_id, module_id, prompt, options, position, image_url, created_at, updated_at
) on public.quiz_questions to authenticated;
