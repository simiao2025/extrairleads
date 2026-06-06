"use client";

import { toast } from "sonner";

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
	try {
		if (!audioCtx) {
			audioCtx = new (
				window.AudioContext || (window as any).webkitAudioContext
			)();
		}
		if (audioCtx.state === "suspended") {
			audioCtx.resume();
		}
		return audioCtx;
	} catch {
		return null;
	}
}

// Som genérico de ação (beep simples)
const playBeep = () => {
	const ctx = getAudioCtx();
	if (!ctx) return;
	try {
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(880, ctx.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(
			1760,
			ctx.currentTime + 0.1,
		);

		gainNode.gain.setValueAtTime(0, ctx.currentTime);
		gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
		gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);
		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + 0.3);
	} catch (e) {
		console.error("Audio API not supported or blocked", e);
	}
};

// Som de nova mensagem — dois tons curtos (estilo WhatsApp)
export const playMessageSound = () => {
	const soundEnabled = localStorage.getItem("soundEnabled") !== "false";
	if (!soundEnabled) return;

	const ctx = getAudioCtx();
	if (!ctx) return;

	try {
		const notes = [
			{ freq: 1174.66, start: 0, duration: 0.12 },      // D6
			{ freq: 1318.51, start: 0.15, duration: 0.12 },   // E6
		];

		for (const note of notes) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "sine";
			osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

			gain.gain.setValueAtTime(0, ctx.currentTime + note.start);
			gain.gain.linearRampToValueAtTime(
				0.18,
				ctx.currentTime + note.start + 0.02,
			);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				ctx.currentTime + note.start + note.duration,
			);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(ctx.currentTime + note.start);
			osc.stop(ctx.currentTime + note.start + note.duration + 0.05);
		}
	} catch (e) {
		console.error("playMessageSound error:", e);
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
