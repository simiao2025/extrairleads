"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteKnowledgeAction, getKnowledgeBaseAction, saveKnowledgeAction } from "./actions";

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<
    { id: number; title: string; content: string; createdAt: Date | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  // Carregar documentos
  const fetchDocuments = async () => {
    try {
      const docs = await getKnowledgeBaseAction();
      setDocuments(docs);
    } catch (_err) {
      setError("Falha ao carregar a base de conhecimento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Adicionar documento
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!title.trim() || !content.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    startTransition(async () => {
      try {
        await saveKnowledgeAction(formData);
        setSuccess("Documento vetorial salvo com sucesso!");
        (e.target as HTMLFormElement).reset();
        await fetchDocuments();
      } catch (err: any) {
        setError(err.message || "Erro ao salvar documento vetorial.");
      }
    });
  };

  // Excluir documento
  const handleDelete = async (id: number) => {
    if (
      !confirm("Tem certeza que deseja remover este documento da base de conhecimento do Agente?")
    )
      return;
    setError("");
    setSuccess("");

    try {
      await deleteKnowledgeAction(id);
      setSuccess("Documento removido da base vetorial.");
      await fetchDocuments();
    } catch (_err) {
      setError("Erro ao excluir o documento.");
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-white p-4 md:p-8">
      {/* Glow de Fundo */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-950/15 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-blue-950/10 blur-[130px]" />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8 pt-4">
        <FadeIn delay={0.1}>
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <BookOpen className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                  Base de Conhecimento{" "}
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    RAG Vetorial
                  </span>
                </h1>
                <p className="text-sm text-zinc-500 font-medium">
                  Cadastre FAQs, serviços e regras para o seu Agente IA consultar em tempo real.
                </p>
              </div>
            </div>
          </header>
        </FadeIn>

        {/* Notificações */}
        {error && (
          <FadeIn>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          </FadeIn>
        )}

        {success && (
          <FadeIn>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          </FadeIn>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulário de Cadastro */}
          <div className="lg:col-span-5">
            <FadeIn delay={0.2}>
              <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-transparent opacity-100 transition-opacity" />
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-400" /> Adicionar Conhecimento
                  </CardTitle>
                  <CardDescription className="text-xs">
                    As informações inseridas abaixo serão convertidas em vetores matemáticos e
                    injetadas na inteligência artificial do SDR.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Título de Referência
                      </label>
                      <Input
                        name="title"
                        required
                        placeholder="Ex: Tabela de Preços do Plano Premium"
                        className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-white placeholder:text-zinc-600 h-12"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Conteúdo Detalhado (FAQ / FAQ do Produto)
                      </label>
                      <Textarea
                        name="content"
                        required
                        rows={8}
                        placeholder="Digite as especificações completas aqui... Quanto mais detalhado e direto ao ponto for o texto, mais assertiva será a resposta da IA. Ex: O plano Premium custa R$ 299/mês, inclui suporte 24h e 50.000 créditos..."
                        className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-zinc-200 placeholder:text-zinc-600 leading-relaxed font-mono text-[13px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 backdrop-blur-md hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:translate-y-0 active:scale-98 transition-all duration-300 cursor-pointer py-6 text-base"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processando Vetores...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Alimentar Cérebro da IA
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Lista de Documentos */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Base Cadastrada ({documents.length})
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-zinc-500 text-sm">Vasculhando base vetorial no Postgres...</p>
              </div>
            ) : documents.length === 0 ? (
              <FadeIn>
                <div className="text-center py-16 px-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-sm">
                  <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold text-base">
                    Nenhum conhecimento alimentado
                  </p>
                  <p className="text-zinc-600 text-xs mt-1 max-w-sm mx-auto">
                    Seu SDR usará apenas o prompt básico. Preencha o formulário ao lado para dar
                    respostas inteligentes de produtos e FAQ à IA.
                  </p>
                </div>
              </FadeIn>
            ) : (
              <StaggerContainer className="grid grid-cols-1 gap-4">
                {documents.map((doc) => (
                  <StaggerItem key={doc.id}>
                    <Card className="border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-emerald-500/20 backdrop-blur-xl transition-all group duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.005] to-transparent" />
                      <CardContent className="p-5 flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-white text-base tracking-tight">
                            {doc.title}
                          </h3>
                          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 font-mono whitespace-pre-wrap">
                            {doc.content}
                          </p>
                          <p className="text-[10px] text-zinc-600 font-medium">
                            Adicionado em:{" "}
                            {doc.createdAt
                              ? new Date(doc.createdAt).toLocaleDateString("pt-BR")
                              : "N/A"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
