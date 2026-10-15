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
   array['Mercado financeiro', 'Ativos', 'Participantes', 'Conceitos-chave'], 1, true),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001',
   'Fundamentos do Trading', 'fundamentos-do-trading',
   'Conheça os tipos de operação, o funcionamento das ordens e como estruturar uma rotina de estudos consistente.',
   array['Tipos de operação', 'Ordens', 'Liquidez', 'Rotina'], 2, true),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001',
   'Leitura de Gráficos e Candlesticks', 'leitura-de-graficos-e-candlesticks',
   'Aprenda a interpretar candles, identificar padrões gráficos e reconhecer regiões de suporte e resistência.',
   array['Candlesticks', 'Padrões gráficos', 'Suporte e resistência'], 3, true),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001',
   'Indicadores e Análise Técnica', 'indicadores-e-analise-tecnica',
   'Estude os principais indicadores técnicos e aprenda a combiná-los com critério, entendendo suas limitações.',
   array['Médias móveis', 'Osciladores', 'Bandas de Bollinger'], 4, true),
  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001',
   'Gerenciamento de Risco', 'gerenciamento-de-risco',
   'Proteja seu capital com tamanho de posição adequado, definição de stops e registro disciplinado das operações.',
   array['Tamanho de posição', 'Stop e alvo', 'Diário de operações'], 5, true),
  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001',
   'Psicologia e Disciplina do Trader', 'psicologia-e-disciplina-do-trader',
   'Reconheça vieses comportamentais, lide melhor com perdas e construa um plano de trading sustentável.',
   array['Vieses', 'Controle emocional', 'Plano de trading'], 6, true);

-- Regras de desbloqueio (exemplo do briefing; editáveis no painel administrativo)
insert into public.module_requirements (module_id, requirement_type, config_json) values
  ('d0000000-0000-4000-8000-000000000001', 'FREE', '{"version": 1}'),
  ('d0000000-0000-4000-8000-000000000002', 'PREVIOUS_MODULE', '{"version": 1, "min_completion_percent": 100}'),
  ('d0000000-0000-4000-8000-000000000003', 'BROKER_ELIGIBILITY',
   '{"version": 1, "requirement_key": "account_funding_confirmed", "label": "Elegibilidade da conta confirmada pela Bullex", "show_deposit_cta": true}'),
  ('d0000000-0000-4000-8000-000000000004', 'COMBINED',
   '{"version": 1, "operator": "AND", "rules": [
      {"type": "PREVIOUS_MODULE", "config": {"version": 1, "min_completion_percent": 100}},
      {"type": "BROKER_ELIGIBILITY", "config": {"version": 1, "requirement_key": "account_funding_confirmed", "label": "Elegibilidade da conta confirmada pela Bullex", "show_deposit_cta": true}}
   ]}'),
  ('d0000000-0000-4000-8000-000000000005', 'PREVIOUS_MODULE', '{"version": 1, "min_completion_percent": 100}'),
  ('d0000000-0000-4000-8000-000000000006', 'PREVIOUS_MODULE', '{"version": 1, "min_completion_percent": 100}');

-- Aulas: Módulo 01 usa vídeos reais (npm run seed:module01); demais módulos usam demos (npm run seed:videos)
insert into public.lessons (module_id, title, description, objectives, topics, video_provider, video_asset_id, duration_seconds, position, is_published)
select
  ('d0000000-0000-4000-8000-00000000000' || l.module_no)::uuid,
  l.title,
  l.description,
  l.objectives,
  l.topics,
  'supabase_storage',
  case
    when l.module_no = 1 then 'module-01/aula-0' || l.position || '.mp4'
    when l.position % 2 = 1 then 'demo/aula-demo-a.mp4'
    else 'demo/aula-demo-b.mp4'
  end,
  case
    when l.module_no = 1 and l.position = 1 then 87
    when l.module_no = 1 and l.position = 2 then 158
    when l.module_no = 1 and l.position = 3 then 140
    when l.module_no = 1 and l.position = 4 then 112
    when l.module_no = 1 and l.position = 5 then 148
    when l.position % 2 = 1 then 90
    else 120
  end,
  l.position,
  true
from (values
  (1, 1, 'Como funcionam as opções binárias', 'Entenda o funcionamento das opções binárias e os conceitos essenciais para começar com clareza.',
     array['Compreender o funcionamento das opções binárias', 'Identificar os elementos de uma operação'], array['Opções binárias', 'Funcionamento', 'Conceitos-chave']),
  (1, 2, 'Gráfico, velas e a plataforma', 'Aprenda a ler o gráfico, interpretar velas e navegar pela plataforma de negociação.',
     array['Ler o gráfico com segurança', 'Reconhecer velas e a interface da plataforma'], array['Gráfico', 'Candlesticks', 'Plataforma']),
  (1, 3, 'Principais indicadores', 'Conheça os principais indicadores técnicos usados na análise do mercado.',
     array['Identificar indicadores relevantes', 'Entender o papel de cada indicador'], array['Indicadores', 'Análise técnica']),
  (1, 4, 'Indicadores na prática', 'Veja como aplicar os indicadores no gráfico e interpretar sinais com critério.',
     array['Aplicar indicadores no gráfico', 'Interpretar sinais com disciplina'], array['Indicadores', 'Prática', 'Sinais']),
  (1, 5, 'Risk free', 'Entenda o conceito de risk free e como ele se relaciona com a gestão de risco nas operações.',
     array['Compreender o risk free', 'Relacionar risco e proteção do capital'], array['Risk free', 'Gestão de risco']),
  (2, 1, 'Tipos de operação', 'Operações de compra e venda, prazos operacionais e perfis de operador.',
     array['Conhecer os tipos de operação'], array['Compra e venda', 'Prazos']),
  (2, 2, 'Plataformas e ordens', 'Como funcionam as ordens a mercado, limitadas e de proteção em uma plataforma de negociação.',
     array['Diferenciar tipos de ordem'], array['Ordem a mercado', 'Ordem limitada', 'Stop']),
  (2, 3, 'Horários e liquidez', 'Por que horários de negociação e liquidez afetam a execução das ordens.',
     array['Relacionar horário e liquidez'], array['Sessões de negociação', 'Liquidez']),
  (2, 4, 'Montando sua rotina de estudo', 'Como organizar estudos, revisões e simulações de forma consistente.',
     array['Planejar uma rotina de estudos'], array['Rotina', 'Revisão']),
  (3, 1, 'Anatomia de um candle', 'Abertura, fechamento, máxima e mínima: lendo um candlestick.',
     array['Ler um candlestick'], array['OHLC', 'Corpo e pavio']),
  (3, 2, 'Padrões de reversão', 'Martelo, engolfo e outros padrões frequentemente associados a reversões.',
     array['Reconhecer padrões de reversão e suas limitações'], array['Martelo', 'Engolfo']),
  (3, 3, 'Padrões de continuação', 'Bandeiras, triângulos e consolidações em tendências.',
     array['Reconhecer padrões de continuação'], array['Bandeiras', 'Triângulos']),
  (3, 4, 'Suportes e resistências', 'Como identificar regiões de preço relevantes no gráfico.',
     array['Marcar suportes e resistências'], array['Suporte', 'Resistência']),
  (4, 1, 'Médias móveis', 'Médias simples e exponenciais e o uso como filtro de tendência.',
     array['Aplicar médias móveis'], array['MMS', 'MME']),
  (4, 2, 'IFR e estocástico', 'Osciladores de momento: leitura, sobrecompra e sobrevenda.',
     array['Interpretar osciladores'], array['IFR', 'Estocástico']),
  (4, 3, 'Bandas de Bollinger', 'Volatilidade e desvios em torno da média.',
     array['Interpretar as bandas de Bollinger'], array['Volatilidade', 'Desvio padrão']),
  (4, 4, 'Combinando indicadores com critério', 'Por que mais indicadores não significam mais acerto.',
     array['Evitar redundância entre indicadores'], array['Confluência', 'Limitações']),
  (5, 1, 'Por que o risco vem primeiro', 'A lógica da preservação de capital.',
     array['Priorizar a gestão de risco'], array['Preservação de capital']),
  (5, 2, 'Tamanho de posição', 'Definindo exposição por operação de acordo com o seu plano.',
     array['Calcular tamanho de posição'], array['Exposição', 'Risco por operação']),
  (5, 3, 'Stop e alvo', 'Definição prévia de saída e relação risco/retorno.',
     array['Definir stop e alvo antes de operar'], array['Stop', 'Risco/retorno']),
  (5, 4, 'Diário de operações', 'Registro e revisão das operações como ferramenta de evolução.',
     array['Manter um diário de operações'], array['Registro', 'Revisão']),
  (6, 1, 'Vieses comportamentais', 'Excesso de confiança, aversão à perda e outros vieses.',
     array['Reconhecer vieses comuns'], array['Vieses cognitivos']),
  (6, 2, 'Lidando com perdas', 'Perdas fazem parte do processo: como não agravá-las.',
     array['Desenvolver resposta racional a perdas'], array['Controle emocional']),
  (6, 3, 'Plano de trading', 'Estruturando regras claras de entrada, saída e gestão.',
     array['Escrever um plano de trading'], array['Regras', 'Checklist']),
  (6, 4, 'Consistência no longo prazo', 'Disciplina, revisão e evolução contínua.',
     array['Construir hábitos consistentes'], array['Disciplina', 'Evolução'])
) as l(module_no, position, title, description, objectives, topics);
