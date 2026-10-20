/**
 * Envia os vídeos reais do Módulo 01 (aulas 1–5) ao bucket privado `lesson-videos`
 * e atualiza os registros em `public.lessons`.
 *
 * Uso (Supabase local rodando, .env.local configurado):
 *   npx tsx scripts/upload-module-01-videos.ts
 *
 * Diretório padrão dos arquivos: Downloads/public-archivedwl-180
 * Override: MODULE_01_VIDEOS_DIR=C:\caminho\pasta
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const MODULE_ID = "d0000000-0000-4000-8000-000000000001";

const LESSONS = [
  {
    position: 1,
    match: /Aula\s*1/i,
    title: "Como funcionam as opções binárias",
    description: "Entenda o funcionamento das opções binárias e os conceitos essenciais para começar com clareza.",
    objectives: ["Compreender o funcionamento das opções binárias", "Identificar os elementos de uma operação"],
    topics: ["Opções binárias", "Funcionamento", "Conceitos-chave"],
    path: "module-01/aula-01.mp4",
    thumbnail: "/thumbs/module-01/aula-01.png",
  },
  {
    position: 2,
    match: /Aula\s*2/i,
    title: "Gráfico, velas e a plataforma",
    description: "Aprenda a ler o gráfico, interpretar velas e navegar pela plataforma de negociação.",
    objectives: ["Ler o gráfico com segurança", "Reconhecer velas e a interface da plataforma"],
    topics: ["Gráfico", "Candlesticks", "Plataforma"],
    path: "module-01/aula-02.mp4",
    thumbnail: "/thumbs/module-01/aula-02.png",
  },
  {
    position: 3,
    match: /Aula\s*3/i,
    title: "Principais indicadores",
    description: "Conheça os principais indicadores técnicos usados na análise do mercado.",
    objectives: ["Identificar indicadores relevantes", "Entender o papel de cada indicador"],
    topics: ["Indicadores", "Análise técnica"],
    path: "module-01/aula-03.mp4",
    thumbnail: "/thumbs/module-01/aula-03.png",
  },
  {
    position: 4,
    match: /Aula\s*4/i,
    title: "Indicadores na prática",
    description: "Veja como aplicar os indicadores no gráfico e interpretar sinais com critério.",
    objectives: ["Aplicar indicadores no gráfico", "Interpretar sinais com disciplina"],
    topics: ["Indicadores", "Prática", "Sinais"],
    path: "module-01/aula-04.mp4",
    thumbnail: "/thumbs/module-01/aula-04.png",
  },
  {
    position: 5,
    match: /Aula\s*5/i,
    title: "Risk free",
    description: "Entenda o conceito de risk free e como ele se relaciona com a gestão de risco nas operações.",
    objectives: ["Compreender o risk free", "Relacionar risco e proteção do capital"],
    topics: ["Risk free", "Gestão de risco"],
    path: "module-01/aula-05.mp4",
    thumbnail: "/thumbs/module-01/aula-05.png",
  },
] as const;

function probeDurationSeconds(filePath: string): number {
  const raw = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" },
  ).trim();
  const seconds = Math.round(Number(raw));
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`Duração inválida para ${filePath}: ${raw}`);
  return seconds;
}

function resolveSourceFile(dir: string, match: RegExp): string {
  const files = readdirSync(dir).filter((name) => name.toLowerCase().endsWith(".mp4"));
  const found = files.find((name) => match.test(name));
  if (!found) throw new Error(`Arquivo não encontrado em ${dir} para padrão ${match}`);
  return join(dir, found);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("upload-module-01-videos não deve ser executado em produção.");
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");

  const sourceDir =
    process.env.MODULE_01_VIDEOS_DIR ?? "C:\\Users\\felip\\Downloads\\public-archivedwl-180";
  if (!existsSync(sourceDir)) throw new Error(`Pasta de vídeos não encontrada: ${sourceDir}`);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const lesson of LESSONS) {
    const source = resolveSourceFile(sourceDir, lesson.match);
    const duration = probeDurationSeconds(source);
    console.log(`→ Aula ${lesson.position}: ${lesson.title}`);
    console.log(`  arquivo: ${source}`);
    console.log(`  duração: ${duration}s → storage:${lesson.path}`);

    const { error: uploadError } = await supabase.storage
      .from("lesson-videos")
      .upload(lesson.path, readFileSync(source), { contentType: "video/mp4", upsert: true });
    if (uploadError) throw new Error(`Upload falhou (${lesson.path}): ${uploadError.message}`);

    const { data: existing, error: selectError } = await supabase
      .from("lessons")
      .select("id")
      .eq("module_id", MODULE_ID)
      .eq("position", lesson.position)
      .maybeSingle();
    if (selectError) throw new Error(`Consulta falhou (posição ${lesson.position}): ${selectError.message}`);

    const payload = {
      module_id: MODULE_ID,
      title: lesson.title,
      description: lesson.description,
      objectives: [...lesson.objectives],
      topics: [...lesson.topics],
      video_provider: "supabase_storage" as const,
      video_asset_id: lesson.path,
      duration_seconds: duration,
      position: lesson.position,
      is_published: true,
      thumbnail_url: lesson.thumbnail,
    };

    if (existing?.id) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", existing.id);
      if (error) throw new Error(`Update falhou (posição ${lesson.position}): ${error.message}`);
      console.log(`  ✓ aula atualizada (${existing.id})`);
    } else {
      const { data: created, error } = await supabase.from("lessons").insert(payload).select("id").single();
      if (error || !created) throw new Error(`Insert falhou (posição ${lesson.position}): ${error?.message}`);
      console.log(`  ✓ aula criada (${created.id})`);
    }
  }

  console.log("Módulo 01: 5 vídeos enviados e aulas sincronizadas.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
