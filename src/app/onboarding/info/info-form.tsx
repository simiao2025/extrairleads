"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { saveOnboardingInfoAction } from "@/app/actions";

interface InfoFormProps {
	initialData: {
		name: string;
		email: string;
		cpfCnpj: string;
	};
}

export default function InfoForm({ initialData }: InfoFormProps) {
	const [cpfCnpj, setCpfCnpj] = useState(initialData.cpfCnpj || "");
	const [phone, setPhone] = useState("");
	const [cep, setCep] = useState("");
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [uf, setUf] = useState("");
	const [loading, setLoading] = useState(false);
	const [cepLoading, setCepLoading] = useState(false);
	const [error, setError] = useState("");

	// Busca CEP automático via ViaCEP
	const handleCepChange = async (val: string) => {
		const cleanCep = val.replace(/\D/g, "");
		setCep(cleanCep);

		if (cleanCep.length === 8) {
			setCepLoading(true);
			setError("");
			try {
				const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
				const data = await res.json();

				if (data.erro) {
					setError("CEP não encontrado.");
				} else {
					setAddress(data.logradouro || "");
					setCity(data.localidade || "");
					setUf(data.uf || "");
				}
			} catch (_err) {
			} finally {
				setCepLoading(false);
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!phone || !cep || !address || !city || !uf || !cpfCnpj) {
			setError(
				"Por favor, preencha todos os campos obrigatórios (incluindo o CPF/CNPJ).",
			);
			return;
		}

		setLoading(true);
		setError("");

		try {
			const res = await saveOnboardingInfoAction({
				phone,
				cpfCnpj,
				address,
				city,
				uf,
				cep,
			});

			if (res.success) {
				window.location.reload();
			} else {
				setError(res.error || "Ocorreu um erro ao salvar os dados.");
			}
		} catch (_err: any) {
			setError("Erro de rede ao salvar os dados.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5 text-zinc-300">
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
					{error}
				</div>
			)}

			{/* Grid de Campos Bloqueados */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
						Nome Completo
					</label>
					<input
						type="text"
						value={initialData.name}
						disabled
						className="w-full bg-[#121214] border border-zinc-800/60 text-zinc-500 px-3.5 py-2.5 rounded-lg text-sm cursor-not-allowed outline-none"
					/>
				</div>

				<div>
					<label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
						E-mail
					</label>
					<input
						type="email"
						value={initialData.email}
						disabled
						className="w-full bg-[#121214] border border-zinc-800/60 text-zinc-500 px-3.5 py-2.5 rounded-lg text-sm cursor-not-allowed outline-none"
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
						CPF / CNPJ <span className="text-emerald-500">*</span>
					</label>
					<input
						type="text"
						required
						placeholder="Digite CPF ou CNPJ (apenas números)"
						value={cpfCnpj}
						onChange={(e) => setCpfCnpj(e.target.value.replace(/\D/g, ""))}
						className="w-full bg-[#121214] border border-zinc-800 text-white px-3.5 py-2.5 rounded-lg text-sm placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all outline-none"
					/>
				</div>

				<div>
					<label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
						Telefone / WhatsApp <span className="text-emerald-500">*</span>
					</label>
					<input
						type="text"
						required
						placeholder="(11) 99999-9999"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						className="w-full bg-[#121214] border border-zinc-800 text-white px-3.5 py-2.5 rounded-lg text-sm placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all outline-none"
					/>
				</div>
			</div>

			<hr className="border-zinc-800/50 my-4" />

			{/* Endereço */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="md:col-span-1 relative">
					<label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
						CEP <span className="text-emerald-500">*</span>
					</label>
					<div className="relative">
						<input
							type="text"
							required
							maxLength={8}
							placeholder="00000000"
							value={cep}
							onChange={(e) => handleCepChange(e.target.value)}
							className="w-full bg-[#121214] border border-zinc-800 text-white pl-3.5 pr-10 py-2.5 rounded-lg text-sm placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all outline-none font-mono"
						/>
						<div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
							{cepLoading ? (
								<Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
							) : (
								<Search className="w-4 h-4" />
							)}
						</div>
					</div>
				</div>

				<div className="md:col-span-2">
					<label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
						Endereço Completo <span className="text-emerald-500">*</span>
					</label>
					<input
						type="text"
						required
						placeholder="Av. Paulista, 1000 - Apto 21"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className="w-full bg-[#121214] border border-zinc-800 text-white px-3.5 py-2.5 rounded-lg text-sm placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all outline-none"
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="md:col-span-2">
					<label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
						Cidade <span className="text-emerald-500">*</span>
					</label>
					<input
						type="text"
						required
						placeholder="São Paulo"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						className="w-full bg-[#121214] border border-zinc-800 text-white px-3.5 py-2.5 rounded-lg text-sm placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all outline-none"
					/>
				</div>

				<div className="md:col-span-1">
					<label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
						Estado (UF) <span className="text-emerald-500">*</span>
					</label>
					<input
						type="text"
						required
						maxLength={2}
						placeholder="SP"
						value={uf}
						onChange={(e) => setUf(e.target.value.toUpperCase())}
						className="w-full bg-[#121214] border border-zinc-800 text-white px-3.5 py-2.5 rounded-lg text-sm placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all outline-none text-center font-semibold"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6 cursor-pointer"
			>
				{loading ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						Salvando Informações...
					</>
				) : (
					"Salvar e Prosseguir"
				)}
			</button>
		</form>
	);
}
