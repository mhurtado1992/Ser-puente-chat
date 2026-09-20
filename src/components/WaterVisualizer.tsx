import { useEffect, useRef } from "react";
import { ThemeStyles } from "../utils/themeConfig";

interface WaterVisualizerProps {
  mode?: "full" | "subtle" | "none";
  themeStyles?: ThemeStyles;
}

export function WaterVisualizer({ mode = "full", themeStyles }: WaterVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    const isLight = themeStyles?.isLight ?? false;
    const isSubtle = mode === "subtle";

    const draw = () => {
      step += isSubtle ? 0.004 : 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const height = canvas.height;
      const width = canvas.width;

      // Color tints using blue #2b3cdb (light gallery vs dark river)
      const waveColors = isLight
        ? [
            "rgba(43, 60, 219, 0.035)",
            "rgba(43, 60, 219, 0.025)",
            "rgba(43, 60, 219, 0.02)",
          ]
        : [
            "rgba(43, 60, 219, 0.06)",
            "rgba(43, 60, 219, 0.045)",
            "rgba(30, 42, 160, 0.07)",
          ];

      const waves = [
        { y: height * 0.85, length: 0.004, amplitude: isSubtle ? 12 : 24, color: waveColors[0] },
        { y: height * 0.88, length: 0.003, amplitude: isSubtle ? 16 : 32, color: waveColors[1] },
        { y: height * 0.92, length: 0.005, amplitude: isSubtle ? 10 : 18, color: waveColors[2] },
      ];

      waves.forEach((w, idx) => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 15) {
          const y = w.y + Math.sin(x * w.length + step * (idx + 1) * 0.8) * w.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [mode, themeStyles]);

  if (mode === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
    />
  );
}