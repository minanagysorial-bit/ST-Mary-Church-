import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  speedY: number;
  swaySpeed: number;
  swayDist: number;
  seed: number;
  color: string;
}

export const FloatingHolyDustRays: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let mouse = { x: -1000, y: -1000, radius: 140 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('touchmove', handleTouchMove, { passive: true });
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('touchend', handleMouseLeave);
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Warm colors: Golden Amber, Radiant Gold, Holy White
    const colors = [
      'rgba(254, 214, 91, ',  // #fed65b
      'rgba(212, 175, 55, ',  // #d4af37
      'rgba(255, 238, 190, ', // Golden Light
      'rgba(255, 255, 255, '  // Holy White
    ];

    let particles: Particle[] = [];
    const PARTICLE_COUNT = Math.min(Math.max(Math.floor(width / 18), 35), 65);

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 3.2 + 1.4,
          baseAlpha: Math.random() * 0.55 + 0.4,
          alpha: Math.random(),
          speedY: Math.random() * 0.75 + 0.3,
          swaySpeed: Math.random() * 0.02 + 0.008,
          swayDist: Math.random() * 30 + 15,
          seed: Math.random() * 1000,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    initParticles();

    let time = 0;

    const render = () => {
      time += 0.018;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Rise upwards like fragrant incense
        p.y -= p.speedY;
        // Sway horizontally
        p.x += Math.sin(time * 2 + p.seed) * 0.75;

        // Interactive mouse repulsion / gentle stir
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 4.5;
          p.y -= Math.sin(angle) * force * 4.5;
        }

        // Recycle particle
        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Twinkle brightness
        const currentAlpha = p.baseAlpha * (0.55 + 0.45 * Math.sin(time * 2.5 + p.seed));

        // Draw radial aura glow
        const glowSize = p.radius * 4.2;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        glow.addColorStop(0, p.color + currentAlpha + ')');
        glow.addColorStop(0.35, p.color + (currentAlpha * 0.5) + ')');
        glow.addColorStop(1, p.color + '0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Draw shiny center spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.min(1, currentAlpha * 1.8) + ')';
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('touchmove', handleTouchMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
        parent.removeEventListener('touchend', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* 🌟 1. Volumetric God Rays (أشعة النور السماوية النازلة) */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen overflow-hidden">
        {/* Ray 1: Main heavenly beam */}
        <div 
          className="absolute -top-40 right-10 sm:right-1/4 w-48 sm:w-80 h-[160%] bg-gradient-to-b from-[#fed65b]/40 via-[#d4af37]/20 to-transparent blur-2xl transform -rotate-22 origin-top animate-ray-sway-1"
        />
        {/* Ray 2: Secondary beam */}
        <div 
          className="absolute -top-32 right-1/3 sm:right-1/2 w-40 sm:w-72 h-[150%] bg-gradient-to-b from-[#fed65b]/30 via-[#d4af37]/15 to-transparent blur-3xl transform -rotate-15 origin-top animate-ray-sway-2"
        />
        {/* Ray 3: Ambient fill beam */}
        <div 
          className="absolute -top-20 left-10 sm:left-1/4 w-36 sm:w-64 h-[130%] bg-gradient-to-b from-[#fed65b]/25 via-[#fed65b]/10 to-transparent blur-3xl transform -rotate-10 origin-top animate-ray-sway-3"
        />
      </div>

      {/* 💨 2. Rising Incense Smoke Nebula (تموجات بخور الهيكل المتصاعد) */}
      <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-[#d4af37]/15 via-[#002366]/20 to-transparent blur-3xl opacity-75 animate-ambient-pulse" />

      {/* ✨ 3. Floating Holy Dust Canvas (جزيئات النور الحية المتطايرة) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};
