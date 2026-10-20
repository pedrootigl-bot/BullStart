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
insert into public.lessons (module_id, title, description, objectives, topics, video_provider, video_asset_id, thumbnail_url, duration_seconds, position, is_published)
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
    when l.module_no = 1 then '/thumbs/module-01/aula-0' || l.position || '.png'
    else null
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

-- ---------------------------------------------------------------------------
-- Provas por módulo (1 quiz × 5 questões cada; aprovação ≥70%, 3 tentativas)
-- ---------------------------------------------------------------------------
insert into public.course_quizzes (id, course_id, module_id, title, description, pass_ratio, max_attempts, is_published) values
  (
    'e0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'Prova — Introdução ao Mercado Financeiro',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'Prova — Fundamentos do Trading',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  ),
  (
    'e0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000003',
    'Prova — Leitura de Gráficos e Candlesticks',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  ),
  (
    'e0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000004',
    'Prova — Indicadores e Análise Técnica',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  ),
  (
    'e0000000-0000-4000-8000-000000000005',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000005',
    'Prova — Gerenciamento de Risco',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  ),
  (
    'e0000000-0000-4000-8000-000000000006',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000006',
    'Prova — Psicologia e Disciplina do Trader',
    'Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.',
    0.70, 3, true
  );

insert into public.quiz_questions (quiz_id, module_id, prompt, options, correct_index, position, image_url) values
  -- Módulo 1
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
   '["Acima do preço de exercício (strike)", "Abaixo do preço de exercício (strike)", "Igual ao volume médio negociado no dia", "Indefinido, pois CALL não possui direção de preço"]'::jsonb, 0, 5, null),
  -- Módulo 2
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
   'O que é uma ordem de mercado?',
   '["Uma ordem executada ao preço disponível no momento", "Uma ordem que nunca é executada", "Um documento de identidade", "Uma taxa cobrada só aos finais de semana"]'::jsonb, 0, 1, null),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
   'Por que a liquidez importa para o trader?',
   '["Facilita entrar e sair de posições com menor atrito de preço", "Garante que o preço só suba", "Elimina a necessidade de stop", "Torna indicadores desnecessários"]'::jsonb, 0, 2, null),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
   'Qual prática ajuda a estruturar uma rotina de estudos consistente?',
   '["Horários definidos, revisão de conteúdo e registro do que foi aprendido", "Estudar só depois de grandes perdas", "Ignorar fundamentos e operar no impulso", "Trocar de estratégia a cada minuto"]'::jsonb, 0, 3, null),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
   'Tipos de operação no trading referem-se principalmente a quê?',
   '["Estilos e horizontes de tempo (scalping, day trade, swing, etc.)", "Apenas o navegador usado no computador", "A cor do gráfico na tela", "O fuso horário do servidor de e-mail"]'::jsonb, 0, 4, null),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
   'Qual atitude é mais alinhada a fundamentos sólidos de trading?',
   '["Conhecer o instrumento, o risco e as regras antes de operar", "Operar o máximo possível sem plano", "Copiar sinais sem entender o motivo", "Aumentar o lote após cada perda"]'::jsonb, 0, 5, null),
  -- Módulo 3
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   'Em um candlestick, o que representam a máxima e a mínima do período?',
   '["O volume negociado e o número de operações", "Os extremos de preço alcançados no intervalo", "Apenas a abertura e o fechamento", "O spread cobrado pela corretora"]'::jsonb, 1, 1, null),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   'O corpo do candle mostra principalmente:',
   '["A relação entre abertura e fechamento do período", "O número de traders online", "A taxa de corretagem", "O saldo da conta bancária"]'::jsonb, 0, 2, null),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   'Suporte e resistência são regiões onde:',
   '["O preço tende a encontrar barreira ou reação com mais frequência", "O gráfico muda de cor automaticamente", "A corretora pausa as operações", "Indicadores deixam de funcionar"]'::jsonb, 0, 3, null),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   'Padrões gráficos ajudam o trader a:',
   '["Organizar hipóteses sobre o comportamento do preço", "Garantir 100% de acerto", "Eliminar a gestão de risco", "Substituir o estudo do ativo"]'::jsonb, 0, 4, null),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   'Um candle de alta (fechamento acima da abertura) sugere, no período:',
   '["Pressão compradora relativa no intervalo analisado", "Que o mercado nunca mais cairá", "Que o volume foi zero", "Que o stop deve ser removido"]'::jsonb, 0, 5, null),
  -- Módulo 4
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   'Qual é uma boa prática ao usar indicadores técnicos?',
   '["Usar o máximo de indicadores possível no mesmo gráfico", "Combiná-los com critério e entender suas limitações", "Ignorar o preço e confiar só no oscilador", "Trocar de indicador a cada operação perdida"]'::jsonb, 1, 1, null),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   'Médias móveis servem principalmente para:',
   '["Suavizar o preço e destacar tendência ou regiões dinâmicas", "Prever notícias econômicas", "Calcular imposto de renda", "Definir o nome do ativo"]'::jsonb, 0, 2, null),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   'Osciladores (como RSI) costumam ajudar a:',
   '["Avaliar condições de sobrecompra/sobrevenda ou momentum", "Garantir entrada sem stop", "Substituir o gráfico de preços", "Eliminar drawdown"]'::jsonb, 0, 3, null),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   'Bandas de Bollinger relacionam-se a:',
   '["Volatilidade e distância estatística em torno de uma média", "Apenas volume de notícias", "O horário de abertura da bolsa de valores física", "O número de módulos do curso"]'::jsonb, 0, 4, null),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   'Sobre limitações de indicadores, o mais correto é:',
   '["São ferramentas auxiliares e podem gerar sinais atrasados ou conflitantes", "Nunca erram se configurados uma vez", "Funcionam sem olhar o preço", "Tornam gestão de risco irrelevante"]'::jsonb, 0, 5, null),
  -- Módulo 5
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005',
   'Na gestão de risco, qual atitude protege melhor o capital?',
   '["Aumentar a exposição após uma sequência de perdas", "Definir tamanho de posição, stop e alvo antes de operar", "Remover o stop para “dar espaço” ao preço", "Operar o maior lote disponível na conta"]'::jsonb, 1, 1, null),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005',
   'O tamanho de posição deve considerar principalmente:',
   '["O risco aceitável por operação em relação ao capital", "A cor preferida do gráfico", "O número de indicadores na tela", "A velocidade da internet"]'::jsonb, 0, 2, null),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005',
   'Stop e alvo, no planejamento, servem para:',
   '["Definir de antemão onde cortar perda e onde realizar lucro", "Garantir que toda operação seja vencedora", "Evitar qualquer registro no diário", "Aumentar o lote automaticamente"]'::jsonb, 0, 3, null),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005',
   'Manter um diário de operações ajuda a:',
   '["Revisar decisões, erros e acertos com disciplina", "Esconder perdas do próprio trader", "Eliminar a necessidade de estudo", "Substituir o gerenciamento de risco"]'::jsonb, 0, 4, null),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005',
   'Após uma sequência de perdas, a atitude mais prudente é:',
   '["Revisar o plano e o risco, sem aumentar exposição por impulso", "Dobrar o lote para recuperar rápido", "Desligar o stop em todas as entradas", "Operar sem limite até zerar a conta"]'::jsonb, 0, 5, null),
  -- Módulo 6
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006',
   'Sobre psicologia e disciplina do trader, qual afirmação é mais adequada?',
   '["Perdas nunca fazem parte de um plano consistente", "Um plano com regras claras de entrada e saída ajuda a reduzir decisões impulsivas", "Excesso de confiança sempre melhora o resultado", "Revisar operações é desnecessário após as primeiras semanas"]'::jsonb, 1, 1, null),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006',
   'Vieses comportamentais podem levar o trader a:',
   '["Tomar decisões irracionais sob emoção ou confirmação seletiva", "Eliminar automaticamente o risco de mercado", "Garantir lucro diário fixo", "Não precisar de plano"]'::jsonb, 0, 2, null),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006',
   'Lidar melhor com perdas inclui:',
   '["Aceitá-las como parte estatística do processo e respeitar o risco definido", "Operar mais agressivo até recuperar", "Ignorar o diário de trades", "Culpar apenas a corretora"]'::jsonb, 0, 3, null),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006',
   'Um plano de trading sustentável prioriza:',
   '["Regras claras, risco controlado e consistência ao longo do tempo", "Mudança constante de estratégia a cada candle", "Operar 24h sem pausas", "Maximizar lotes em notícias"]'::jsonb, 0, 4, null),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006',
   'Controle emocional no trading significa principalmente:',
   '["Seguir o plano mesmo sob pressão, sem reagir por impulso", "Nunca sentir emoção alguma", "Operar só quando estiver irritado", "Desligar o stop em operações longas"]'::jsonb, 0, 5, null);
