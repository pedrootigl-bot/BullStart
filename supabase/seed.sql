-- Seed de DESENVOLVIMENTO (executado apenas por `supabase db reset` local).
-- Conteúdo educacional demonstrativo; nenhum dado financeiro real.
-- Usuários locais:
--   admin@bullexstart.local  / BullexAdmin2026  (admin)
--   aluno@bullexstart.local  / BullexAluno2026  (aluno com vínculo DEV com a corretora)
--   novo@bullexstart.local   / BullexNovo2026   (aluno sem vínculo verificado)

-- ---------------------------------------------------------------------------
-- Usuários (Supabase Auth local)
-- ---------------------------------------------------------------------------
do $$
declare
  v_users jsonb := '[
    {"id": "a0000000-0000-4000-8000-000000000001", "email": "admin@bullexstart.local", "password": "BullexAdmin2026", "name": "Equipe Bullex Start"},
    {"id": "a0000000-0000-4000-8000-000000000002", "email": "aluno@bullexstart.local", "password": "BullexAluno2026", "name": "Marina Duarte Alves"},
    {"id": "a0000000-0000-4000-8000-000000000003", "email": "novo@bullexstart.local",  "password": "BullexNovo2026",  "name": "Rafael Nogueira"}
  ]';
  v_user jsonb;
begin
  for v_user in select * from jsonb_array_elements(v_users) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      (v_user ->> 'id')::uuid,
      'authenticated',
      'authenticated',
      v_user ->> 'email',
      extensions.crypt(v_user ->> 'password', extensions.gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', v_user ->> 'name'),
      now(), now(), '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(),
      (v_user ->> 'id')::uuid,
      v_user ->> 'id',
      jsonb_build_object('sub', v_user ->> 'id', 'email', v_user ->> 'email', 'email_verified', true),
      'email',
      now(), now(), now()
    );
  end loop;
end;
$$;

update public.profiles set role = 'admin'
where auth_user_id = 'a0000000-0000-4000-8000-000000000001';

-- Vínculo DEV: simula um vínculo previamente validado por integração confiável.
update public.profiles
set broker_user_id = 'DEV-LOCAL-0001',
    broker_account_status = 'active',
    broker_verification_status = 'verified',
    broker_registered_at = now() - interval '30 days',
    broker_linked_at = now(),
    broker_last_synced_at = now()
where auth_user_id = 'a0000000-0000-4000-8000-000000000002';

-- ---------------------------------------------------------------------------
-- Curso, módulos e aulas
-- ---------------------------------------------------------------------------
insert into public.courses (id, title, slug, description, is_published, workload_hours, completion_min_watch_ratio)
values (
  'c0000000-0000-4000-8000-000000000001',
  'Formação Trader Bullex',
  'formacao-trader-bullex',
  'Programa educacional Bullex Start: fundamentos do mercado financeiro, leitura de gráficos, análise técnica, gestão de risco e disciplina.',
  true,
  12,
  0.80
);

insert into public.modules (id, course_id, title, slug, description, topics, position, is_published) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'Introdução ao Mercado Financeiro', 'introducao-ao-mercado-financeiro',
   'Entenda como o mercado financeiro funciona, quem são os participantes e quais são os principais ativos negociados.',
   array['Mercado financeiro', 'Ativos', 'Participantes', 'Conceitos-chave'], 1, true);

-- Regras de desbloqueio (editáveis no painel administrativo)
insert into public.module_requirements (module_id, requirement_type, config_json) values
  ('d0000000-0000-4000-8000-000000000001', 'FREE', '{"version": 1}');

-- Aulas do Módulo 01 (vídeos reais via npm run seed:module01)
insert into public.lessons (module_id, title, description, objectives, topics, video_provider, video_asset_id, thumbnail_url, duration_seconds, position, is_published)
select
  'd0000000-0000-4000-8000-000000000001'::uuid,
  l.title,
  l.description,
  l.objectives,
  l.topics,
  'supabase_storage',
  'module-01/aula-0' || l.position || '.mp4',
  '/thumbs/module-01/aula-0' || l.position || '.png',
  case l.position
    when 1 then 87
    when 2 then 158
    when 3 then 140
    when 4 then 112
    when 5 then 148
  end,
  l.position,
  true
from (values
  (1, 'Como funcionam as opções binárias', 'Entenda o funcionamento das opções binárias e os conceitos essenciais para começar com clareza.',
     array['Compreender o funcionamento das opções binárias', 'Identificar os elementos de uma operação'], array['Opções binárias', 'Funcionamento', 'Conceitos-chave']),
  (2, 'Gráfico, velas e a plataforma', 'Aprenda a ler o gráfico, interpretar velas e navegar pela plataforma de negociação.',
     array['Ler o gráfico com segurança', 'Reconhecer velas e a interface da plataforma'], array['Gráfico', 'Candlesticks', 'Plataforma']),
  (3, 'Principais indicadores', 'Conheça os principais indicadores técnicos usados na análise do mercado.',
     array['Identificar indicadores relevantes', 'Entender o papel de cada indicador'], array['Indicadores', 'Análise técnica']),
  (4, 'Indicadores na prática', 'Veja como aplicar os indicadores no gráfico e interpretar sinais com critério.',
     array['Aplicar indicadores no gráfico', 'Interpretar sinais com disciplina'], array['Indicadores', 'Prática', 'Sinais']),
  (5, 'Risk free', 'Entenda o conceito de risk free e como ele se relaciona com a gestão de risco nas operações.',
     array['Compreender o risk free', 'Relacionar risco e proteção do capital'], array['Risk free', 'Gestão de risco'])
) as l(position, title, description, objectives, topics);

-- ---------------------------------------------------------------------------
-- Prova do Módulo 01 (5 questões; aprovação ≥70%, 3 tentativas)
-- ---------------------------------------------------------------------------
insert into public.course_quizzes (id, course_id, module_id, title, description, pass_ratio, max_attempts, is_published) values
  (
    'e0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'Prova — Introdução ao Mercado Financeiro',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  );

insert into public.quiz_questions (quiz_id, module_id, prompt, options, correct_index, position, image_url) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'O que é payout?',
   '["O retorno percentual ou fixo pago sobre o valor investido quando a previsão da operação acerta", "A taxa cobrada pela corretora em toda operação, independente do resultado", "O preço mínimo que o ativo precisa atingir para abrir o gráfico", "O saldo mínimo exigido para criar uma conta na plataforma"]'::jsonb, 0, 1, null),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Observe a imagem. Em um candlestick, o que a sombra (pavio) superior representa?',
   '["A máxima atingida no período, acima do corpo da vela", "O preço de abertura da sessão seguinte", "A média móvel simples de 20 períodos", "O volume de contratos em aberto no mercado futuro"]'::jsonb, 0, 2, '/quiz/module-01/q2-candlestick.png'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Observe a imagem. Qual é a função principal de um indicador técnico no gráfico?',
   '["Sintetizar dados de preço e/ou volume para apoiar a leitura de tendência, momentum ou volatilidade", "Garantir a execução automática de ordens com lucro mínimo", "Substituir a necessidade de definir tempo de expiração na operação", "Determinar sozinho o tamanho ideal da posição em cada trade"]'::jsonb, 0, 3, '/quiz/module-01/q3-indicador.png'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'O que significa compra e venda no mercado de trading?',
   '["Compra (CALL) antecipa alta do preço; venda (PUT) antecipa queda até o vencimento", "Compra e venda significam apenas transferir saldo entre contas da corretora", "Compra garante lucro; venda cancela automaticamente a operação anterior", "Compra e venda são nomes de indicadores técnicos obrigatórios no gráfico"]'::jsonb, 0, 4, null),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Em uma operação de compra (CALL) em opções binárias, o trader espera que, no vencimento, o preço do ativo esteja:',
   '["Acima do preço de exercício (strike)", "Abaixo do preço de exercício (strike)", "Igual ao volume médio negociado no dia", "Indefinido, pois CALL não possui direção de preço"]'::jsonb, 0, 5, null);
