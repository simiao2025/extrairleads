"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  FileUp,
  HelpCircle,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteKnowledgeAction,
  getKnowledgeBaseAction,
  saveKnowledgeAction,
  updateKnowledgeAction,
} from "./knowledge-actions";

export default function KnowledgeBaseTab() {
  const [documents, setDocuments] = useState<
    { id: number; title: string; content: string; createdAt: Date | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Carregar documentos
  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await getKnowledgeBaseAction();
      setDocuments(docs);
    } catch (_err) {
      setError("Falha ao carregar a base de conhecimento.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Erro ao salvar documento vetorial.");
        } else {
          setError("Erro ao salvar documento vetorial.");
        }
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

  // Atualizar documento
  const handleUpdate = async (id: number) => {
    if (!editTitle.trim() || !editContent.trim()) {
      setError("Título e conteúdo não podem ficar vazios.");
      return;
    }
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        await updateKnowledgeAction(id, editTitle, editContent);
        setSuccess("Documento atualizado com sucesso!");
        setEditingId(null);
        await fetchDocuments();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Erro ao atualizar documento.");
        } else {
          setError("Erro ao atualizar documento.");
        }
      }
    });
  };

  return (
    <div className="space-y-8 pt-4">
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
        <div className="lg:col-span-5 space-y-6">
          {/* Formulário de Upload de Documento */}
          <FadeIn delay={0.15}>
            <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-transparent opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-400" /> Upload de Documento
                </CardTitle>
                <CardDescription className="text-xs">
                  Faça upload de um PDF ou TXT. O sistema extrairá o texto e adicionará à base
                  vetorial.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError("");
                    setSuccess("");

                    const fileInput = e.currentTarget.elements.namedItem(
                      "file",
                    ) as HTMLInputElement;
                    const file = fileInput.files?.[0];
                    if (!file) {
                      setError("Selecione um arquivo.");
                      return;
                    }

                    const formData = new FormData();
                    formData.append("file", file);

                    startTransition(async () => {
                      try {
                        const res = await fetch("/api/knowledge/upload", {
                          method: "POST",
                          body: formData,
                        });

                        if (!res.ok) {
                          const errText = await res.text();
                          throw new Error(errText || "Erro ao fazer upload");
                        }

                        setSuccess("Documento processado com sucesso!");
                        (e.target as HTMLFormElement).reset();
                        // Recarregar os documentos criados, por enquanto fetchDocuments traz apenas da tabela knowledgeBase.
                        // Precisaremos de uma tabela conjunta ou apenas listar da knowledgeBase (que vai agrupar chunks com o mesmo título do documento).
                        await fetchDocuments();
                      } catch (err: unknown) {
                        if (err instanceof Error) {
                          setError(err.message || "Erro no upload.");
                        } else {
                          setError("Erro no upload.");
                        }
                      }
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="file-upload"
                      className="text-xs font-bold text-zinc-400 uppercase tracking-wider"
                    >
                      Arquivo (PDF / TXT)
                    </label>
                    <Input
                      id="file-upload"
                      name="file"
                      type="file"
                      accept=".pdf,.txt"
                      required
                      className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-white placeholder:text-zinc-600 h-12 pt-2.5"
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
                        Processando...
                      </>
                    ) : (
                      <>
                        <FileUp className="w-5 h-5 mr-2" />
                        Fazer Upload e Vetorizar
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Formulário de Cadastro Manual */}
          <FadeIn delay={0.2}>
            <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.01] to-transparent opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" /> Inserção Manual
                </CardTitle>
                <CardDescription className="text-xs">
                  As informações inseridas abaixo serão convertidas em vetores matemáticos e
                  injetadas na inteligência artificial do SDR.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="title-input"
                      className="text-xs font-bold text-zinc-400 uppercase tracking-wider"
                    >
                      Título de Referência
                    </label>
                    <Input
                      id="title-input"
                      name="title"
                      required
                      placeholder="Ex: Tabela de Preços do Plano Premium"
                      className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-white placeholder:text-zinc-600 h-12"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="content-textarea"
                      className="text-xs font-bold text-zinc-400 uppercase tracking-wider"
                    >
                      Conteúdo Detalhado (FAQ / FAQ do Produto)
                    </label>
                    <Textarea
                      id="content-textarea"
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
                <p className="text-zinc-400 font-bold text-base">Nenhum conhecimento alimentado</p>
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
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.005] to-transparent" />
                    <CardContent className="p-5 flex flex-col gap-4 relative z-10">
                      {editingId === doc.id ? (
                        <div className="space-y-4">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-white font-bold h-10"
                          />
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                            className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-zinc-200 leading-relaxed font-mono text-[13px]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate(doc.id)}
                              disabled={isPending}
                              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all font-medium py-1.5 px-3 rounded-lg text-sm flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                              ) : null}
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={isPending}
                              className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: clickable area */}
                          {/* biome-ignore lint/a11y/noStaticElementInteractions: clickable area */}
                          <div
                            className="space-y-2 flex-1 cursor-pointer relative z-10 hover:bg-white/[0.02] p-2 -m-2 rounded-lg transition-colors"
                            onClick={() => {
                              setEditingId(doc.id);
                              setEditTitle(doc.title);
                              setEditContent(doc.content);
                            }}
                          >
                            <h3 className="font-bold text-white text-base tracking-tight hover:text-emerald-400 transition-colors">
                              {doc.title}
                            </h3>
                            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 font-mono whitespace-pre-wrap hover:text-zinc-300 transition-colors">
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </div>
  );
}
