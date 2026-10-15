import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bullex Start — Formação Trader Bullex",
    template: "%s · Bullex Start",
  },
  description:
    "Sua jornada para evoluir como trader começa aqui. Plataforma educacional Bullex Start com módulos, acompanhamento de progresso e certificado de conclusão.",
  applicationName: "Bullex Start",
};

export const viewport: Viewport = {
  themeColor: "#060807",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full`} data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-ink-950"
        >
          Pular para o conteúdo
        </a>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-ink-800 !border-white/10 !text-mist-100 !font-sans",
              description: "!text-mist-300",
            },
          }}
        />
      </body>
    </html>
  );
}
