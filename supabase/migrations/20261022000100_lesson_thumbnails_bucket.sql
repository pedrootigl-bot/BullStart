-- Storage: bucket público de miniaturas de aulas (leitura pública; upload via service role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-thumbnails',
  'lesson-thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
