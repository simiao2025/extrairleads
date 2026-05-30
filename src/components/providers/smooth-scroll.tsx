"use client";

import type React from "react";

export function SmoothScrollProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// Desativado Lenis smooth-scroll para evitar conflitos com rolagem de 2 dedos (trackpad) e dispositivos touch.
	// A rolagem nativa de navegadores modernos oferece excelente inércia e suporte a gestos sem quebras de layout.
	return <>{children}</>;
}
