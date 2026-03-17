"use client";

import { useEffect, useRef } from "react";

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Konfigurasi Partikel
    const particleCount = 80;
    const connectionDistance = 130;
    const mouseRadius = 180;
    
    const getThemeColor = () => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      return isLight ? 99 : 139; // RGB R value as base determining light vs dark (99=indigo, 139=purple)
    };

    let mouse = { x: -1000, y: -1000 };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 1; 
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas!.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas!.height || this.y < 0) this.speedY = -this.speedY;
      }

      draw() {
        if (!ctx) return;
        const colorBase = getThemeColor();
        ctx.fillStyle = colorBase === 99 ? "rgba(99, 102, 241, 0.4)" : "rgba(168, 85, 247, 0.4)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorBase = getThemeColor();
      const rgb = colorBase === 99 ? "99, 102, 241" : "139, 92, 246"; // Indigo for light, Purple for dark
      const connectColor = colorBase === 99 ? "168, 85, 247" : "99, 102, 241"; // Secondary color
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Cek jarak antar partikel untuk dihubungkan dengan garis
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < connectionDistance) {
            ctx.beginPath();
            const opacity = (1 - (distance / connectionDistance)) * 0.3;
            ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Cek jarak dengan kursor mouse untuk garis sorotan
        const dxMouse = particles[i].x - mouse.x;
        const dyMouse = particles[i].y - mouse.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceMouse < mouseRadius) {
           ctx.beginPath();
           // Garis ke mouse lebih tebal dan terang
           const opacity = (1 - (distanceMouse / mouseRadius)) * 0.6;
           ctx.strokeStyle = `rgba(${connectColor}, ${opacity})`;
           ctx.lineWidth = 1.2;
           ctx.moveTo(particles[i].x, particles[i].y);
           ctx.lineTo(mouse.x, mouse.y);
           ctx.stroke();
           
           // Interaksi gravitasi (dorong sedikit partikel jika terlalu dekat)
           if (distanceMouse < mouseRadius / 2) {
             particles[i].x += dxMouse * 0.02;
             particles[i].y += dyMouse * 0.02;
           }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
       mouse.x = -1000;
       mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="particles-bg-container">
      <canvas ref={canvasRef} className="main-particles-container" />
    </div>
  );
}
