import React, { useRef, useEffect } from "react";

export function Boxes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(230, 59, 46, 0.08), transparent 60%)`;
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Isometric grid - pure CSS, zero DOM nodes */}
      <div style={{
        position: 'absolute',
        inset: '-50%',
        width: '200%',
        height: '200%',
        transform: 'translate(-40%, -60%) skewX(-48deg) skewY(14deg) scale(0.675)',
        backgroundImage: `
          linear-gradient(to right, rgba(17,17,17,0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(17,17,17,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '64px 32px',
      }} />

      {/* Mouse follow glow */}
      <div ref={glowRef} style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 1,
      }} />

      {/* Radial fade mask */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#E8E4DD',
        maskImage: 'radial-gradient(transparent, white)',
        WebkitMaskImage: 'radial-gradient(transparent, white)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
    </div>
  );
}
