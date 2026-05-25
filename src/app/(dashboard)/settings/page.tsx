"use client";

import {
  CheckCircle2,
  Cpu,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  Server,
  Sliders,
  Smartphone,
  CreditCard,
  Gem,
  User as UserIcon,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from "react";
import {
  checkWhatsAppConnectionAction,
  getWhatsAppQrCodeAction,
  getWhatsAppSettingsAction,
  saveWhatsAppSettingsAction,
} from "@/app/actions";
import { notify } from "@/lib/notify";

export default function SettingsPage() {
  const [whatsappStatus, setWhatsappStatus] = useState<{
    connected: boolean;
    state: string;
    instanceName?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [pollingActive, setPollingActive] = useState(false);

  // Novos states para Meta Official
  const [provider, setProvider] = useState<"evolution" | "meta_official">("evolution");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [profileInfo, setProfileInfo] = useState({ name: "", email: "", plan: "Starter", leadsBalance: 0 });

  // Status simulado das variáveis globais do .env (como estamos no client, usamos fallbacks simples)
  const envStatus = {
    database: true, // Já que estamos rodando logados
    serpapi: true,
    openai: true,
    groq: true,
    evolution: true,
  };

  const integrations = [
    {
      name: "Banco de Dados Neon Postgres",
      key: envStatus.database,
      icon: Server,
      desc: "Armazenamento na nuvem multi-tenant seguro",
    },
    {
      name: "Google Maps (SerpApi)",
      key: envStatus.serpapi,
      icon: Lock,
      desc: "Motor de busca de novos leads comerciais",
    },
    {
      name: "Llama 3.3 (Groq API)",
      key: envStatus.groq,
      icon: Cpu,
      desc: "Análise neural e geração de abordagens de vendas",
    },
    {
      name: "Evolution Go v3 (WhatsApp)",
      key: envStatus.evolution,
      icon: Smartphone,
      desc: "Motor de disparos ultra-veloz em Go",
    },
  ];

  // Carregar configurações iniciais
  useEffect(() => {
    const loadSettings = async () => {
      const res = await getWhatsAppSettingsAction();
      if (res.success) {
        setProvider(res.provider as "evolution" | "meta_official");
        setMetaAccessToken(res.metaAccessToken || "");
        setMetaPhoneNumberId(res.metaPhoneNumberId || "");
        setMetaWabaId(res.metaWabaId || "");
        setNotificationsEnabled(res.notificationsEnabled !== false);
        localStorage.setItem("soundEnabled", res.notificationsEnabled !== false ? "true" : "false");
        setProfileInfo({ 
          name: res.name || "Usuário", 
          email: res.email || "",
          plan: res.plan || "Starter",
          leadsBalance: res.leadsBalance || 0
        });
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const res = await saveWhatsAppSettingsAction({
      provider,
      metaAccessToken,
      metaPhoneNumberId,
      metaWabaId,
      notificationsEnabled,
    });
    localStorage.setItem("soundEnabled", notificationsEnabled ? "true" : "false");
    setSavingSettings(false);
    if (!res.success) {
      notify("Erro ao salvar: " + res.error, { type: "error" });
    } else {
      notify("Configurações salvas com sucesso!", { type: "success" });
    }
  };

  // Checar conexão do WhatsApp
  const handleCheckConnection = useCallback(async (showLoading = true) => {
    if (showLoading) setChecking(true);
    try {
      const res = await checkWhatsAppConnectionAction();
      if (res.success) {
        setWhatsappStatus({
          connected: !!res.connected,
          state: res.state || "DISCONNECTED",
          instanceName: res.instanceName,
        });
        if (res.connected) {
          setQrCode(null);
          setPollingActive(false);
        }
      }
    } catch (_err) {
    } finally {
      if (showLoading) setChecking(false);
    }
  }, []);

  // Gerar QR Code
  const handleGenerateQr = async () => {
    setQrLoading(true);
    setQrError("");
    try {
      const res = await getWhatsAppQrCodeAction();
      if (res.success && res.qrCode) {
        // Trata se o retorno já possui cabeçalho de imagem data:image/png;base64,
        const formattedQr = res.qrCode.startsWith("data:")
          ? res.qrCode
          : `data:image/png;base64,${res.qrCode}`;
        setQrCode(formattedQr);
        setPollingActive(true);
      } else {
        setQrError(
          res.error ||
            "Não foi possível carregar o QR Code. Certifique-se de que a instância está criada.",
        );
      }
    } catch (_err) {
      setQrError("Erro de rede ao carregar QR Code.");
    } finally {
      setQrLoading(false);
    }
  };

  // Checagem automática (Polling) quando o QR Code é exibido
  useEffect(() => {
    handleCheckConnection(true);
  }, [handleCheckConnection]);

  useEffect(() => {
    let interval: any;
    if (pollingActive && whatsappStatus && !whatsappStatus.connected) {
      interval = setInterval(() => {
        handleCheckConnection(false);
      }, 5000); // Polling a cada 5 segundos
    }

    if (whatsappStatus?.connected) {
      setPollingActive(false);
      setQrCode(null);
    }

    return () => clearInterval(interval);
  }, [pollingActive, whatsappStatus, handleCheckConnection]);

  return (
    <div className="relative min-h-screen bg-background text-foreground p-4 md:p-8 overflow-hidden">
      {/* Grid de Efeito de Fundo - Extremamente Sutil B2B */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-500">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3 font-heading">
              <Sliders className="w-8 h-8 text-white" />
              Configurações
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Gerencie sua assinatura, conexão de WhatsApp e status das integrações.
            </p>
          </div>
        </div>

        {/* Profile Quick Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-white border border-zinc-700 shadow-inner shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none" />
              <UserIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-heading">{profileInfo.name || "Carregando..."}</h2>
              <p className="text-sm text-zinc-400">{profileInfo.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Plano Atual</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5" />
                {profileInfo.plan}
              </span>
            </div>
          </div>
        </div>

        {/* Layout em Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1 e 2: Módulo de Conexão WhatsApp */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">Canal de Disparo WhatsApp</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Emparelhe seu celular para realizar os envios dinâmicos das campanhas.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckConnection(true)}
                  disabled={checking}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all duration-200"
                  title="Atualizar Conexão"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${checking ? "animate-spin text-emerald-500" : ""}`}
                  />
                </button>
              </div>

              {/* Seletor de Provedor */}
              <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">Provedor Padrão</h3>
                  <p className="text-xs text-zinc-500">Escolha por onde o sistema enviará as mensagens.</p>
                </div>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0">
                  <button
                    onClick={() => { setProvider("evolution"); handleSaveSettings(); }}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${provider === "evolution" ? "bg-emerald-500 text-emerald-950 shadow-lg" : "text-zinc-400 hover:text-white"}`}
                  >
                    Evolution Go
                  </button>
                  <button
                    onClick={() => { setProvider("meta_official"); handleSaveSettings(); }}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${provider === "meta_official" ? "bg-blue-500 text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
                  >
                    Meta Oficial API
                  </button>
                </div>
              </div>

              {provider === "evolution" ? (
                <>
                  {/* Status do Canal */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <span className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
                        Status Atual
                      </span>
                      <div className="flex items-center gap-2.5 mt-1">
                        {whatsappStatus?.connected ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-400 font-bold text-sm bg-emerald-400/5 border border-emerald-400/10 px-3 py-0.5 rounded-full">
                              🟢 CONECTADO
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <span className="text-red-400 font-bold text-sm bg-red-400/5 border border-red-500/10 px-3 py-0.5 rounded-full">
                              🔴 DESCONECTADO
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {whatsappStatus?.instanceName && (
                      <div>
                        <span className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
                          Identificador da Instância
                        </span>
                        <p className="text-zinc-300 font-mono text-sm mt-1">
                          {whatsappStatus.instanceName}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lógica de QR Code / Conexão Ativa */}
                  <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-6">
                    {whatsappStatus?.connected ? (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="max-w-sm mx-auto space-y-2">
                          <h3 className="font-bold text-white text-lg">WhatsApp Ativo!</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            Sua conexão individual no Evolution Go v3 está operando perfeitamente. Todas
                            as suas campanhas e fluxos de prospecção neural serão disparados por este
                            canal de forma segura.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-4">
                          <h3 className="font-bold text-white text-base">
                            Como conectar seu WhatsApp?
                          </h3>
                          <ol className="text-zinc-400 text-xs space-y-2.5 list-decimal pl-4 leading-relaxed">
                            <li>
                              Clique no botão <strong className="text-zinc-200">"Gerar QR Code"</strong>{" "}
                              ao lado.
                            </li>
                            <li>Abra o WhatsApp em seu aparelho celular.</li>
                            <li>
                              Toque em <strong className="text-zinc-200">Aparelhos Conectados</strong>{" "}
                              &gt; <strong className="text-zinc-200">Conectar Aparelho</strong>.
                            </li>
                            <li>
                              Aponte a câmera do seu celular para a tela para escanear o QR Code gerado.
                            </li>
                            <li>
                              O sistema identificará e ativará o canal automaticamente em até 5 segundos
                              após a leitura.
                            </li>
                          </ol>

                          <button
                            onClick={handleGenerateQr}
                            disabled={qrLoading || checking}
                            className="w-full md:w-auto bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                          >
                            {qrLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <QrCode className="w-4 h-4" />
                                Gerar QR Code
                              </>
                            )}
                          </button>

                          {qrError && (
                            <p className="text-red-400 text-xs mt-2 bg-red-400/5 border border-red-500/10 p-2 rounded-lg">
                              {qrError}
                            </p>
                          )}
                        </div>

                        {/* QR Code Container */}
                        <div className="flex flex-col items-center justify-center p-4 border border-zinc-800 bg-[#0c0c0e] rounded-xl min-h-[220px] relative">
                          {qrLoading ? (
                            <div className="text-center space-y-2 text-zinc-500">
                              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                              <p className="text-xs">Gerando canal...</p>
                            </div>
                          ) : qrCode ? (
                            <div className="text-center space-y-3">
                              <div className="bg-white p-2 rounded-lg inline-block">
                                <img
                                  src={qrCode}
                                  alt="WhatsApp QR Code"
                                  className="w-[180px] h-[180px] object-contain"
                                />
                              </div>
                              <p className="text-zinc-500 text-[10px] animate-pulse flex items-center gap-1.5 justify-center">
                                <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                                Aguardando leitura do celular...
                              </p>
                            </div>
                          ) : (
                            <div className="text-center space-y-2 text-zinc-600 max-w-[180px]">
                              <QrCode className="w-10 h-10 mx-auto opacity-30" />
                              <p className="text-[11px] leading-relaxed">
                                Clique em gerar para exibir o código QR de sincronização.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="border border-blue-900/30 bg-blue-950/10 rounded-xl p-6 space-y-5">
                  <div>
                    <h3 className="font-bold text-white text-base text-blue-400">Credenciais Meta Cloud API</h3>
                    <p className="text-xs text-zinc-400 mt-1">Preencha com os dados do painel do Facebook Developers.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Access Token</label>
                        <Tooltip content="O Token Permanente gerado no portal Meta for Developers." />
                      </div>
                      <input 
                        type="password" 
                        value={metaAccessToken}
                        onChange={(e) => setMetaAccessToken(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:border-blue-500 outline-none" 
                        placeholder="EAA..." 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Phone Number ID</label>
                        <Tooltip content="Identificador Numérico do Telefone de Origem (diferente do WABA ID)." />
                      </div>
                      <input 
                        type="text" 
                        value={metaPhoneNumberId}
                        onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:border-blue-500 outline-none" 
                        placeholder="Ex: 123456789012345" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">WABA ID</label>
                        <Tooltip content="WhatsApp Business Account ID. Encontrado nas configurações da conta do Meta." />
                      </div>
                      <input 
                        type="text" 
                        value={metaWabaId}
                        onChange={(e) => setMetaWabaId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:border-blue-500 outline-none" 
                        placeholder="Ex: 123456789012345" 
                      />
                    </div>
                    <button 
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-6 rounded-md transition-all"
                    >
                      {savingSettings ? "Salvando..." : "Salvar Credenciais Meta"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preferências Gerais */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl mt-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-heading">
                <Sliders className="w-5 h-5 text-emerald-500" />
                Preferências Gerais
              </h2>
              
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Efeitos Sonoros</h3>
                  <p className="text-xs text-zinc-400">Tocar som ao receber novas notificações ou mensagens (via Toast).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationsEnabled}
                    onChange={(e) => {
                      setNotificationsEnabled(e.target.checked);
                      localStorage.setItem("soundEnabled", e.target.checked ? "true" : "false");
                    }}
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-500/20 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-2 px-6 rounded-md transition-all"
                >
                  {savingSettings ? "Salvando..." : "Salvar Preferências"}
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 3: Status das Integrações e Faturamento */}
          <div className="space-y-6">
            {/* Billing / Usage Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white font-heading">Seu Plano e Limites</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-zinc-400 font-medium">Saldo de Leads (Créditos)</span>
                      <span className="text-emerald-400 font-mono font-bold">{profileInfo.leadsBalance} Restantes</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000" style={{ width: `${Math.min(100, (profileInfo.leadsBalance / 500) * 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2">Os créditos são consumidos a cada busca de leads realizada pelo robô.</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800/80">
                    <button 
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
                    >
                      Comprar Mais Leads
                    </button>
                    <button 
                      onClick={() => window.open("https://pay.kiwify.com.br/login", "_blank")}
                      className="w-full mt-2 text-zinc-400 hover:text-white text-xs py-2 transition-colors font-medium"
                    >
                      Gerenciar Assinatura
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-1.5 font-heading">Integrações Globais</h2>
              <p className="text-zinc-500 text-xs mb-6">
                Status dos motores e credenciais de inteligência artificial de faturamento global do
                app.
              </p>

              <div className="space-y-4">
                {integrations.map((integration, i) => (
                  <div
                    key={i}
                    className="flex flex-col p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                        <integration.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {integration.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {integration.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2.5">
                      <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
                        Status
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ativo
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-zinc-900">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Todas as chaves de acesso são mantidas em ambiente de isolamento criptográfico seguro.
            <br />
            Para modificações de arquitetura do sistema, entre em contato com o suporte técnico.
          </p>
        </div>
      </div>

      {/* Subscription Overlay Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsSubscriptionModalOpen(false)}
          />
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <Gem className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white font-heading mb-2">Desbloqueie Mais Leads</h2>
              <p className="text-zinc-400 text-sm">
                Adicione créditos avulsos que <strong className="text-zinc-200">não expiram</strong> e mantenha seu Motor de Vendas acelerando.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { amount: "1.000", price: "R$ 79,00", link: "#" },
                { amount: "2.500", price: "R$ 169,00", link: "#" },
                { amount: "10.000", price: "R$ 497,00", link: "#" },
              ].map((pack, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedPackIndex(idx)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${selectedPackIndex === idx ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-emerald-500/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPackIndex === idx ? 'border-emerald-500' : 'border-zinc-700 group-hover:border-emerald-500'}`}>
                       <div className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-opacity ${selectedPackIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                    </div>
                    <span className="font-bold text-white font-mono">{pack.amount} Leads</span>
                  </div>
                  <span className="font-bold text-emerald-400">{pack.price}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setUpgradeLoading(true);
                setTimeout(() => {
                  setUpgradeLoading(false);
                  const packs = [
                    { link: "#1000" }, // Substituir pelo link real
                    { link: "#2500" }, // Substituir pelo link real
                    { link: "#10000" } // Substituir pelo link real
                  ];
                  const selectedLink = packs[selectedPackIndex].link;
                  
                  if (selectedLink.startsWith("#")) {
                    notify("Aviso: O link de checkout da Kiwify ainda não foi configurado.", { type: "info" });
                  } else {
                    window.open(`${selectedLink}?email=${encodeURIComponent(profileInfo.email)}`, "_blank");
                  }
                  
                  setIsSubscriptionModalOpen(false);
                }, 800);
              }}
              disabled={upgradeLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Redirecionando...
                </>
              ) : (
                "Prosseguir para Pagamento"
              )}
            </button>
            <button 
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="w-full mt-3 text-zinc-500 hover:text-white text-sm py-2 transition-colors font-medium"
            >
              Cancelar e Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
