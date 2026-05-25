import fs from "fs/promises";
import path from "path";
import ReactMarkdown from "react-markdown";
import { Book } from "lucide-react";

export const metadata = {
  title: "Manual de Uso | ExtrairLeads",
  description: "Aprenda a utilizar o motor neural de prospecção.",
};

export default async function ManualPage() {
  const filePath = path.join(process.cwd(), "docs", "manual_de_uso.md");
  let content = "Manual não encontrado.";

  try {
    content = await fs.readFile(filePath, "utf-8");
  } catch (e) {
    console.error("Erro ao ler manual_de_uso.md:", e);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center gap-4 border-b border-zinc-900 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Book className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-black text-white tracking-tight">
              Central de Ajuda
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Tudo que você precisa saber para operar o ExtrairLeads.
            </p>
          </div>
        </header>

        <article className="prose prose-invert prose-emerald max-w-none 
          prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight 
          prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl
          prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:text-emerald-300
          prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
          prose-strong:text-emerald-100
          prose-li:marker:text-emerald-500
          bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 md:p-10 shadow-2xl">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
