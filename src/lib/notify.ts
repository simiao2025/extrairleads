"use client";

import { toast } from "sonner";

// Função para tocar um beep simples usando a Web Audio API
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz (A5)
    
    // Envelope para um som curto e agradável de "notificação"
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio API not supported", e);
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
