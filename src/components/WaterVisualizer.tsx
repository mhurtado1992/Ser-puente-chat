import { useEffect, useRef } from "react";

export function WaterVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    const draw = () => {
      step += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const height = canvas.height;
      const width = canvas.width;

      // Draw subtle luminous water wave lines across bottom/middle
      const waves = [
        { y: height * 0.85, length: 0.004, amplitude: 24, color: "rgba(20, 95, 90, 0.04)" },
        { y: height * 0.88, length: 0.003, amplitude: 32, color: "rgba(35, 120, 110, 0.03)" },
        { y: height * 0.92, length: 0.005, amplitude: 18, color: "rgba(15, 65, 75, 0.05)" },
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
      aria-hidden="true"
    />
  );
}
