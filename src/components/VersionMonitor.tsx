"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Tempo de checagem: a cada 5 minutos
const CHECK_INTERVAL = 5 * 60 * 1000;

export default function VersionMonitor() {
	const [currentVersion, setCurrentVersion] = useState<string | null>(null);

	useEffect(() => {
		// 1. Pega a versão inicial quando o app carrega pela primeira vez
		const fetchInitialVersion = async () => {
			try {
				const res = await fetch(`/version.json?t=${Date.now()}`, {
					cache: "no-store",
				});
				if (res.ok) {
					const data = await res.json();
					setCurrentVersion(data.version);
				}
			} catch (error) {
				console.error("Erro ao buscar versão inicial", error);
			}
		};

		fetchInitialVersion();
	}, []);

	useEffect(() => {
		if (!currentVersion) return;

		// 2. Fica checando em background a cada intervalo
		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/version.json?t=${Date.now()}`, {
					cache: "no-store",
				});
				if (res.ok) {
					const data = await res.json();

					if (data.version && data.version !== currentVersion) {
						// Versão diferente encontrada!
						toast("Nova versão disponível! 🚀", {
							description:
								"O painel foi atualizado. Clique para recarregar e receber as novidades.",
							duration: Infinity, // Não some até clicar
							icon: <RefreshCw className="h-4 w-4 animate-spin" />,
							action: {
								label: "Atualizar Agora",
								onClick: () => window.location.reload(),
							},
						});

						// Para de checar depois que avisou a primeira vez
						clearInterval(interval);
					}
				}
			} catch (error) {
				console.error("Erro ao checar atualização", error);
			}
		}, CHECK_INTERVAL);

		return () => clearInterval(interval);
	}, [currentVersion]);

	return null; // É um componente invisível
}
