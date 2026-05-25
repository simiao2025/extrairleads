"use client";

import { useEffect, useRef } from "react";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Matrix characters - katakana + latin
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン";
    const charArray = chars.split("");

    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start at random negative y positions to stagger the initial drop
    }

    const draw = () => {
      // Create a fading effect to create trails. The lower the alpha, the longer the trails.
      ctx.fillStyle = "rgba(5, 5, 5, 0.1)"; // Using the background color of the app
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Randomly make some characters brighter
        if (Math.random() > 0.95) {
          ctx.fillStyle = "#fff"; // White for the head of the drop
        } else {
          ctx.fillStyle = "#10b981"; // emerald-500
        }
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop if it hits the bottom or randomly to create varied lengths
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.offsetWidth;
      height = canvasRef.current.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }
    };

    window.addEventListener("resize", handleResize);
    const interval = setInterval(draw, 50); // ~20fps for classic look

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
    />
  );
}
