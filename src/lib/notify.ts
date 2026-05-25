"use client";

import { toast } from "sonner";

let audioCtx: AudioContext | null = null;

// Função para tocar um beep simples usando a Web Audio API
const playBeep = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Muitos navegadores iniciam o contexto de áudio em estado 'suspended' até a primeira interação real
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    // Frequência inicial (A5) com rampa para (A6) para um efeito de "ding" agradável
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
    
    // Envelope para um som curto (Volume ajustado para 0.2 para ser mais audível)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio API not supported or blocked", e);
  }
};

interface NotifyOptions {
  sound?: boolean;
  type?: "success" | "error" | "info" | "warning";
}

export const notify = (message: string, options?: NotifyOptions) => {
  const { sound = true, type = "success" } = options || {};

  // Check localStorage for global sound preference (we will set this in settings)
  const soundEnabled = localStorage.getItem("soundEnabled") !== "false";

  if (sound && soundEnabled) {
    playBeep();
  }

  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    default:
      toast(message);
      break;
  }
};
