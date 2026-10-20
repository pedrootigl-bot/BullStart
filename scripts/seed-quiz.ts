/**
 * Insere/atualiza provas por módulo no Supabase local.
 * Uso: npx tsx scripts/seed-quiz.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const COURSE_ID = "c0000000-0000-4000-8000-000000000001";

type QuestionSeed = {
  prompt: string;
  options: string[];
  correct_index: number;
  position: number;
  image_url?: string | null;
};

type ModuleQuizSeed = {
  id: string;
  module_id: string;
  title: string;
  questions: QuestionSeed[];
};

const QUIZZES: ModuleQuizSeed[] = [
  {
    id: "e0000000-0000-4000-8000-000000000001",
    module_id: "d0000000-0000-4000-8000-000000000001",
    title: "Prova — Introdução ao Mercado Financeiro",
    questions: [
      {
        prompt: "O que é payout?",
        options: [
          "O retorno percentual ou fixo pago sobre o valor investido quando a previsão da operação acerta",
          "A taxa cobrada pela corretora em toda operação, independente do resultado",
          "O preço mínimo que o ativo precisa atingir para abrir o gráfico",
          "O saldo mínimo exigido para criar uma conta na plataforma",
        ],
        correct_index: 0,
        position: 1,
      },
      {
        prompt: "Observe a imagem. Em um candlestick, o que a sombra (pavio) superior representa?",
        options: [
          "A máxima atingida no período, acima do corpo da vela",
          "O preço de abertura da sessão seguinte",
          "A média móvel simples de 20 períodos",
          "O volume de contratos em aberto no mercado futuro",
        ],
        correct_index: 0,
        position: 2,
        image_url: "/quiz/module-01/q2-candlestick.png",
      },
      {
        prompt: "Observe a imagem. Qual é a função principal de um indicador técnico no gráfico?",
        options: [
          "Sintetizar dados de preço e/ou volume para apoiar a leitura de tendência, momentum ou volatilidade",
          "Garantir a execução automática de ordens com lucro mínimo",
          "Substituir a necessidade de definir tempo de expiração na operação",
          "Determinar sozinho o tamanho ideal da posição em cada trade",
        ],
        correct_index: 0,
        position: 3,
        image_url: "/quiz/module-01/q3-indicador.png",
      },
      {
        prompt: "O que significa compra e venda no mercado de trading?",
        options: [
          "Compra (CALL) antecipa alta do preço; venda (PUT) antecipa queda até o vencimento",
          "Compra e venda significam apenas transferir saldo entre contas da corretora",
          "Compra garante lucro; venda cancela automaticamente a operação anterior",
          "Compra e venda são nomes de indicadores técnicos obrigatórios no gráfico",
        ],
        correct_index: 0,
        position: 4,
      },
      {
        prompt:
          "Em uma operação de compra (CALL) em opções binárias, o trader espera que, no vencimento, o preço do ativo esteja:",
        options: [
          "Acima do preço de exercício (strike)",
          "Abaixo do preço de exercício (strike)",
          "Igual ao volume médio negociado no dia",
          "Indefinido, pois CALL não possui direção de preço",
        ],
        correct_index: 0,
        position: 5,
      },
    ],
  },
  {
    id: "e0000000-0000-4000-8000-000000000002",
    module_id: "d0000000-0000-4000-8000-000000000002",
    title: "Prova — Fundamentos do Trading",
    questions: [
      {
        prompt: "O que é uma ordem de mercado?",
        options: [
          "Uma ordem executada ao preço disponível no momento",
          "Uma ordem que nunca é executada",
          "Um documento de identidade",
          "Uma taxa cobrada só aos finais de semana",
        ],
        correct_index: 0,
        position: 1,
      },
      {
        prompt: "Por que a liquidez importa para o trader?",
        options: [
          "Facilita entrar e sair de posições com menor atrito de preço",
          "Garante que o preço só suba",
          "Elimina a necessidade de stop",
          "Torna indicadores desnecessários",
        ],
        correct_index: 0,
        position: 2,
      },
      {
        prompt: "Qual prática ajuda a estruturar uma rotina de estudos consistente?",
        options: [
          "Horários definidos, revisão de conteúdo e registro do que foi aprendido",
          "Estudar só depois de grandes perdas",
          "Ignorar fundamentos e operar no impulso",
          "Trocar de estratégia a cada minuto",
        ],
        correct_index: 0,
        position: 3,
      },
      {
        prompt: "Tipos de operação no trading referem-se principalmente a quê?",
        options: [
          "Estilos e horizontes de tempo (scalping, day trade, swing, etc.)",
          "Apenas o navegador usado no computador",
          "A cor do gráfico na tela",
          "O fuso horário do servidor de e-mail",
        ],
        correct_index: 0,
        position: 4,
      },
      {
        prompt: "Qual atitude é mais alinhada a fundamentos sólidos de trading?",
        options: [
          "Conhecer o instrumento, o risco e as regras antes de operar",
          "Operar o máximo possível sem plano",
          "Copiar sinais sem entender o motivo",
          "Aumentar o lote após cada perda",
        ],
        correct_index: 0,
        position: 5,
      },
    ],
  },
  {
    id: "e0000000-0000-4000-8000-000000000003",
    module_id: "d0000000-0000-4000-8000-000000000003",
    title: "Prova — Leitura de Gráficos e Candlesticks",
    questions: [
      {
        prompt: "Em um candlestick, o que representam a máxima e a mínima do período?",
        options: [
          "O volume negociado e o número de operações",
          "Os extremos de preço alcançados no intervalo",
          "Apenas a abertura e o fechamento",
          "O spread cobrado pela corretora",
        ],
        correct_index: 1,
        position: 1,
      },
      {
        prompt: "O corpo do candle mostra principalmente:",
        options: [
          "A relação entre abertura e fechamento do período",
          "O número de traders online",
          "A taxa de corretagem",
          "O saldo da conta bancária",
        ],
        correct_index: 0,
        position: 2,
      },
      {
        prompt: "Suporte e resistência são regiões onde:",
        options: [
          "O preço tende a encontrar barreira ou reação com mais frequência",
          "O gráfico muda de cor automaticamente",
          "A corretora pausa as operações",
          "Indicadores deixam de funcionar",
        ],
        correct_index: 0,
        position: 3,
      },
      {
        prompt: "Padrões gráficos ajudam o trader a:",
        options: [
          "Organizar hipóteses sobre o comportamento do preço",
          "Garantir 100% de acerto",
          "Eliminar a gestão de risco",
          "Substituir o estudo do ativo",
        ],
        correct_index: 0,
        position: 4,
      },
      {
        prompt: "Um candle de alta (fechamento acima da abertura) sugere, no período:",
        options: [
          "Pressão compradora relativa no intervalo analisado",
          "Que o mercado nunca mais cairá",
          "Que o volume foi zero",
          "Que o stop deve ser removido",
        ],
        correct_index: 0,
        position: 5,
      },
    ],
  },
  {
    id: "e0000000-0000-4000-8000-000000000004",
    module_id: "d0000000-0000-4000-8000-000000000004",
    title: "Prova — Indicadores e Análise Técnica",
    questions: [
      {
        prompt: "Qual é uma boa prática ao usar indicadores técnicos?",
        options: [
          "Usar o máximo de indicadores possível no mesmo gráfico",
          "Combiná-los com critério e entender suas limitações",
          "Ignorar o preço e confiar só no oscilador",
          "Trocar de indicador a cada operação perdida",
        ],
        correct_index: 1,
        position: 1,
      },
      {
        prompt: "Médias móveis servem principalmente para:",
        options: [
          "Suavizar o preço e destacar tendência ou regiões dinâmicas",
          "Prever notícias econômicas",
          "Calcular imposto de renda",
          "Definir o nome do ativo",
        ],
        correct_index: 0,
        position: 2,
      },
      {
        prompt: "Osciladores (como RSI) costumam ajudar a:",
        options: [
          "Avaliar condições de sobrecompra/sobrevenda ou momentum",
          "Garantir entrada sem stop",
          "Substituir o gráfico de preços",
          "Eliminar drawdown",
        ],
        correct_index: 0,
        position: 3,
      },
      {
        prompt: "Bandas de Bollinger relacionam-se a:",
        options: [
          "Volatilidade e distância estatística em torno de uma média",
          "Apenas volume de notícias",
          "O horário de abertura da bolsa de valores física",
          "O número de módulos do curso",
        ],
        correct_index: 0,
        position: 4,
      },
      {
        prompt: "Sobre limitações de indicadores, o mais correto é:",
        options: [
          "São ferramentas auxiliares e podem gerar sinais atrasados ou conflitantes",
          "Nunca erram se configurados uma vez",
          "Funcionam sem olhar o preço",
          "Tornam gestão de risco irrelevante",
        ],
        correct_index: 0,
        position: 5,
      },
    ],
  },
  {
    id: "e0000000-0000-4000-8000-000000000005",
    module_id: "d0000000-0000-4000-8000-000000000005",
    title: "Prova — Gerenciamento de Risco",
    questions: [
      {
        prompt: "Na gestão de risco, qual atitude protege melhor o capital?",
        options: [
          "Aumentar a exposição após uma sequência de perdas",
          "Definir tamanho de posição, stop e alvo antes de operar",
          'Remover o stop para "dar espaço" ao preço',
          "Operar o maior lote disponível na conta",
        ],
        correct_index: 1,
        position: 1,
      },
      {
        prompt: "O tamanho de posição deve considerar principalmente:",
        options: [
          "O risco aceitável por operação em relação ao capital",
          "A cor preferida do gráfico",
          "O número de indicadores na tela",
          "A velocidade da internet",
        ],
        correct_index: 0,
        position: 2,
      },
      {
        prompt: "Stop e alvo, no planejamento, servem para:",
        options: [
          "Definir de antemão onde cortar perda e onde realizar lucro",
          "Garantir que toda operação seja vencedora",
          "Evitar qualquer registro no diário",
          "Aumentar o lote automaticamente",
        ],
        correct_index: 0,
        position: 3,
      },
      {
        prompt: "Manter um diário de operações ajuda a:",
        options: [
          "Revisar decisões, erros e acertos com disciplina",
          "Esconder perdas do próprio trader",
          "Eliminar a necessidade de estudo",
          "Substituir o gerenciamento de risco",
        ],
        correct_index: 0,
        position: 4,
      },
      {
        prompt: "Após uma sequência de perdas, a atitude mais prudente é:",
        options: [
          "Revisar o plano e o risco, sem aumentar exposição por impulso",
          "Dobrar o lote para recuperar rápido",
          "Desligar o stop em todas as entradas",
          "Operar sem limite até zerar a conta",
        ],
        correct_index: 0,
        position: 5,
      },
    ],
  },
  {
    id: "e0000000-0000-4000-8000-000000000006",
    module_id: "d0000000-0000-4000-8000-000000000006",
    title: "Prova — Psicologia e Disciplina do Trader",
    questions: [
      {
        prompt: "Sobre psicologia e disciplina do trader, qual afirmação é mais adequada?",
        options: [
          "Perdas nunca fazem parte de um plano consistente",
          "Um plano com regras claras de entrada e saída ajuda a reduzir decisões impulsivas",
          "Excesso de confiança sempre melhora o resultado",
          "Revisar operações é desnecessário após as primeiras semanas",
        ],
        correct_index: 1,
        position: 1,
      },
      {
        prompt: "Vieses comportamentais podem levar o trader a:",
        options: [
          "Tomar decisões irracionais sob emoção ou confirmação seletiva",
          "Eliminar automaticamente o risco de mercado",
          "Garantir lucro diário fixo",
          "Não precisar de plano",
        ],
        correct_index: 0,
        position: 2,
      },
      {
        prompt: "Lidar melhor com perdas inclui:",
        options: [
          "Aceitá-las como parte estatística do processo e respeitar o risco definido",
          "Operar mais agressivo até recuperar",
          "Ignorar o diário de trades",
          "Culpar apenas a corretora",
        ],
        correct_index: 0,
        position: 3,
      },
      {
        prompt: "Um plano de trading sustentável prioriza:",
        options: [
          "Regras claras, risco controlado e consistência ao longo do tempo",
          "Mudança constante de estratégia a cada candle",
          "Operar 24h sem pausas",
          "Maximizar lotes em notícias",
        ],
        correct_index: 0,
        position: 4,
      },
      {
        prompt: "Controle emocional no trading significa principalmente:",
        options: [
          "Seguir o plano mesmo sob pressão, sem reagir por impulso",
          "Nunca sentir emoção alguma",
          "Operar só quando estiver irritado",
          "Desligar o stop em operações longas",
        ],
        correct_index: 0,
        position: 5,
      },
    ],
  },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");

  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: course, error: courseError } = await db.from("courses").select("id").eq("id", COURSE_ID).maybeSingle();
  if (courseError) throw courseError;
  if (!course) throw new Error(`Curso ${COURSE_ID} não encontrado. Rode o seed do Supabase.`);

  for (const quiz of QUIZZES) {
    const { error: quizError } = await db.from("course_quizzes").upsert(
      {
        id: quiz.id,
        course_id: COURSE_ID,
        module_id: quiz.module_id,
        title: quiz.title,
        description: "Avalie o que aprendeu neste módulo. A aprovação conta para o certificado da formação.",
        pass_ratio: 0.7,
        max_attempts: 3,
        is_published: true,
      },
      { onConflict: "module_id" },
    );
    if (quizError) throw quizError;

    const { error: deleteError } = await db.from("quiz_questions").delete().eq("quiz_id", quiz.id);
    if (deleteError) throw deleteError;

    const { error: insertError } = await db.from("quiz_questions").insert(
      quiz.questions.map((q) => ({
        quiz_id: quiz.id,
        module_id: quiz.module_id,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        position: q.position,
        image_url: q.image_url ?? null,
      })),
    );
    if (insertError) throw insertError;
  }

  const { count } = await db
    .from("quiz_questions")
    .select("*", { count: "exact", head: true })
    .in(
      "quiz_id",
      QUIZZES.map((q) => q.id),
    );

  console.log(`OK: ${QUIZZES.length} provas · ${count ?? 0} questões`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
