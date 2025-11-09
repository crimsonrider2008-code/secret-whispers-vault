import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  audioData?: number[];
  isRecording?: boolean;
  className?: string;
}

export const Waveform = ({ audioData = [], isRecording, className }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const barWidth = 3;
    const gap = 2;
    const barCount = Math.floor(width / (barWidth + gap));

    // Generate bars from audio data or random for animation
    const bars = audioData.length > 0
      ? audioData.slice(0, barCount)
      : Array.from({ length: barCount }, () => Math.random());

    bars.forEach((value, i) => {
      const barHeight = isRecording
        ? Math.max(10, value * height * 0.8)
        : value * height * 0.6;
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "hsl(263, 70%, 50%)");
      gradient.addColorStop(1, "hsl(263, 70%, 40%)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }, [audioData, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={120}
      className={cn("w-full h-full", className)}
    />
  );
};
