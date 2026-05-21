"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TEMPLATES = [
  {
    name: "Farmácia de Plantão",
    description: "Ideal para vender soluções de conveniência para farmácias.",
    prompt: `Você é um SDR sênior especializado em soluções para o setor farmacêutico.
Estamos vendendo o "Plantão Digital", um bot de WhatsApp que informa aos cidadãos qual farmácia está de plantão hoje na cidade.

DIRETRIZES:
1. Comece notando que eles são uma farmácia importante em [CIDADE].
2. Mencione que muitos clientes ligam para saber sobre o plantão e que isso toma tempo da equipe.
3. Apresente o "Plantão Digital" como a solução para automatizar essa dúvida e ainda fidelizar o cliente.
4. CTA: Ofereça um teste gratuito de 7 dias.

Mantenha a mensagem curta (máximo 4 parágrafos pequenos).`,
  },
  {
    name: "Marketing para Dentistas",
    description: "Focado em captação de pacientes e presença digital.",
    prompt: `Você é um SDR especialista em marketing para clínicas odontológicas.
Nossa solução é a criação de sites de alta conversão e automação de agendamentos.

DIRETRIZES:
1. Comente que notou a falta de um site oficial ou que o atual poderia converter mais.
2. Cite que o nicho de Dentistas está muito competitivo em [CIDADE].
3. Proponha transformar o WhatsApp deles em uma máquina de agendamentos automáticos.
4. CTA: Pergunte se pode enviar o link de um modelo que fizemos para o nicho deles.`,
  },
  {
    name: "Automação para Restaurantes",
    description: "Focado em delivery e cardápio digital.",
    prompt: `Você é um SDR focado em tecnologia para gastronomia.
Vendemos um sistema de cardápio digital que elimina as taxas abusivas dos apps de entrega.

DIRETRIZES:
1. Elogie as avaliações positivas que eles possuem.
2. Pergunte se eles já pararam para calcular quanto deixam de lucro nos apps de delivery por mês.
3. Apresente a solução de pedido direto via WhatsApp sem comissão.
4. CTA: Peça o melhor horário para uma demonstração de 5 minutos.`,
  },
];

export function PromptTemplates() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-white">Templates de Prompt</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {TEMPLATES.map((template, i) => (
          <Card
            key={i}
            className="bg-zinc-900/40 border-zinc-800 hover:border-emerald-500/30 transition-all group"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-bold text-emerald-400">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    {template.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400"
                  onClick={() => copyToClipboard(template.prompt, i)}
                >
                  {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-zinc-500 font-mono line-clamp-3 leading-relaxed">
                {template.prompt}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
