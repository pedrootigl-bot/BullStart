/**
 * Gera vídeos de DEMONSTRAÇÃO (padrão de teste + tom) com ffmpeg e envia ao bucket privado
 * `lesson-videos`, nos caminhos referenciados por supabase/seed.sql.
 *
 * Uso: npm run seed:videos   (requer ffmpeg no PATH e Supabase local em execução)
 * Nunca use em produção: o conteúdo real é enviado pelo painel /admin/aulas.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const VIDEOS = [
  { path: "demo/aula-demo-a.mp4", seconds: 90, frequency: 440, label: "Bull Academy - Aula demo A" },
  { path: "demo/aula-demo-b.mp4", seconds: 120, frequency: 523, label: "Bull Academy - Aula demo B" },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("seed:videos não pode ser executado em produção.");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");

  const outDir = join(process.cwd(), "tmp-media");
  mkdirSync(outDir, { recursive: true });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const video of VIDEOS) {
    const file = join(outDir, video.path.replace("/", "-"));
    if (!existsSync(file)) {
      console.log(`Gerando ${file} (${video.seconds}s)…`);
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-f", "lavfi", "-i", `testsrc2=size=1280x720:rate=30:duration=${video.seconds}`,
          "-f", "lavfi", "-i", `sine=frequency=${video.frequency}:sample_rate=44100:duration=${video.seconds}`,
          "-vf", "format=yuv420p",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
          "-c:a", "aac", "-b:a", "96k",
          "-movflags", "+faststart",
          "-metadata", `title=${video.label}`,
          "-shortest",
          file,
        ],
        { stdio: "inherit" },
      );
    }

    const { error } = await supabase.storage
      .from("lesson-videos")
      .upload(video.path, readFileSync(file), { contentType: "video/mp4", upsert: true });
    if (error) throw new Error(`Falha ao enviar ${video.path}: ${error.message}`);
    console.log(`✓ Enviado lesson-videos/${video.path}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
