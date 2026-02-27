import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const SIGNAL_RED = '#E63B2E';
const DARK = '#111111';
const BAR_COUNT = 10;

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedVolumeRef = useRef(0);
  const animationIdRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // DPI scaling — cap at 2x for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Use CSS dimensions for drawing calculations
    const drawWidth = rect.width;
    const drawHeight = rect.height;

    let pulsePhase = 0;

    const draw = () => {
      if (!isVisibleRef.current) return;

      // Clear with opaque background (matches parent bg)
      ctx.fillStyle = '#F5F2EC'; // offwhite / paper tone
      ctx.fillRect(0, 0, drawWidth, drawHeight);

      // Smooth volume with exponential decay
      smoothedVolumeRef.current = smoothedVolumeRef.current * 0.85 + volume * 0.15;
      const sv = smoothedVolumeRef.current;

      const centerX = drawWidth / 2;
      const centerY = drawHeight / 2;
      const baseRadius = Math.min(drawWidth, drawHeight) * 0.25;

      // Central circle with subtle pulse
      pulsePhase += 0.03;
      const pulseScale = 1 + (isActive ? Math.sin(pulsePhase) * 0.05 * (1 + sv) : 0);
      const coreRadius = baseRadius * pulseScale;

      // Glow behind center
      const glow = ctx.createRadialGradient(centerX, centerY, coreRadius * 0.5, centerX, centerY, coreRadius * 2);
      glow.addColorStop(0, `rgba(230, 59, 46, ${0.15 + sv * 0.2})`);
      glow.addColorStop(1, 'rgba(245, 242, 236, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Central filled circle
      ctx.fillStyle = DARK;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring accent
      ctx.strokeStyle = SIGNAL_RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Radial bar segments
      if (isActive) {
        const barInnerRadius = coreRadius + 10;
        const maxBarHeight = Math.min(drawWidth, drawHeight) * 0.3;
        const barWidth = (Math.PI * 2) / BAR_COUNT - 0.08;

        for (let i = 0; i < BAR_COUNT; i++) {
          const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
          const variation = Math.sin(pulsePhase * 2 + i * 1.3) * 0.3 + 0.7;
          const barHeight = maxBarHeight * sv * variation;

          if (barHeight < 2) continue;

          const outerRadius = barInnerRadius + barHeight;

          ctx.beginPath();
          ctx.arc(centerX, centerY, barInnerRadius, angle, angle + barWidth);
          ctx.arc(centerX, centerY, outerRadius, angle + barWidth, angle, true);
          ctx.closePath();

          const opacity = 0.6 + sv * 0.4;
          ctx.fillStyle = `rgba(230, 59, 46, ${opacity})`;
          ctx.fill();
        }
      }

      animationIdRef.current = requestAnimationFrame(draw);
    };

    // Pause/resume on visibility change to save battery
    const handleVisibility = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        cancelAnimationFrame(animationIdRef.current);
      } else {
        isVisibleRef.current = true;
        animationIdRef.current = requestAnimationFrame(draw);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    draw();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive, volume]);

  return (
    <canvas
      ref={canvasRef}
      className="w-[min(35vw,200px)] h-[min(35vw,200px)] md:w-[200px] md:h-[200px]"
    />
  );
};
