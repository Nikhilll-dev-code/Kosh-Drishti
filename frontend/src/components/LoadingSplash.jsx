import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Sparkles, ArrowRight, Award, Compass, Layers, CheckCircle2 } from 'lucide-react';

export const LoadingSplash = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [ripples, setRipples] = useState([]);
  const canvasRef = useRef(null);

  const stages = [
    { code: '01', title: 'INITIALIZING CIVIC DATA FABRIC', desc: 'Syncing 543 Lok Sabha Constituencies' },
    { code: '02', title: 'CALIBRATING PARLIAMENTARY LEDGER', desc: 'Verifying Statutory Scheme Allocations' },
    { code: '03', title: 'GROUNDING CAG STATUTORY HEURISTICS', desc: 'Rule Compliance & Transparency Standards' },
    { code: '04', title: 'NATIONAL GATEWAY ONLINE', desc: 'Ready for Public & Audit Access' }
  ];

  // Particle Constellation Canvas Simulation (Interactive to mouse)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(65, Math.floor((width * height) / 18000));
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.6 ? '#F59E0B' : '#60A5FA'
      });
    }

    let mouse = { x: width / 2, y: height / 2, isHovered: false };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isHovered = true;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connective lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = 0.55;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#F59E0B';
            ctx.globalAlpha = (1 - dist / 130) * 0.18;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Connect to interactive mouse
        if (mouse.isHovered) {
          const mDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (mDist < 160) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = '#FCD34D';
            ctx.globalAlpha = (1 - mDist / 160) * 0.35;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Smooth Counter Progress Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 4) + 1;
        if (next >= 25 && next < 55) setActiveStage(1);
        else if (next >= 55 && next < 85) setActiveStage(2);
        else if (next >= 85) setActiveStage(3);
        return Math.min(100, next);
      });
    }, 28);

    return () => clearInterval(interval);
  }, []);

  // Auto-finish shortly after hitting 100% or on user click
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isReady, onFinish]);

  const handleScreenClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 800);
  };

  const handleInstantEnter = () => {
    if (onFinish) onFinish();
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleScreenClick}
      className="fixed inset-0 z-[99999] bg-[#070E1A] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden cursor-crosshair"
    >
      {/* Background Interactive Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Interactive Click Ripples */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {ripples.map((rip) => (
          <motion.div
            key={rip.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400 bg-amber-400/10 pointer-events-none"
            style={{ left: rip.x, top: rip.y }}
          />
        ))}
      </div>

      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-serif font-bold flex items-center justify-center shadow-lg shadow-amber-500/20 text-sm">
            KD
          </div>
          <div>
            <div className="font-serif font-bold text-base text-slate-100 flex items-center gap-2">
              KOSH-DRISHTI
              <span className="text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                SIH26102
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans hidden sm:block">
              AI-Powered Anomaly &amp; Fraud Detection in MPLAD Scheme
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInstantEnter}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Skip / Enter</span> &rarr;
          </button>
        </div>
      </div>

      {/* Center Cinematic Display */}
      <div className="relative z-20 max-w-2xl w-full mx-auto my-auto py-8 text-center space-y-8">
        {/* Animated Central Seal & Pulse Rings */}
        <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
          {/* Rotating Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-amber-500/40"
          ></motion.div>

          {/* Pulsing Aura */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full bg-amber-500/10 blur-md"
          ></motion.div>

          {/* Central Shield Icon */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-ledger-navy to-slate-950 border border-amber-500/60 flex items-center justify-center shadow-xl shadow-amber-500/20"
          >
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </motion.div>
        </div>

        {/* Large Cinematic Progress Counter */}
        <div className="space-y-2">
          <div className="font-mono font-bold text-5xl sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-white to-amber-300 tracking-tight">
            {String(progress).padStart(3, '0')}%
          </div>
          <div className="text-xs font-mono text-amber-400/90 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            {stages[activeStage].title}
          </div>
          <p className="text-xs text-slate-400 font-sans">
            {stages[activeStage].desc}
          </p>
        </div>

        {/* Multi-segment Progress Indicator Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-full bg-slate-900 rounded-full h-2 p-0.5 border border-slate-800 overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-1">
            <span>543 CONSTITUENCIES</span>
            <span>28 STATES &middot; 8 UTs</span>
            <span>CAG RULE ENGINE</span>
          </div>
        </div>

        {/* Interactive Click Cue */}
        <div className="text-[11px] text-slate-400 font-mono italic">
          Tip: Click or move cursor anywhere to interact with the transparency constellation field.
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-sans">
        <div>
          Ministry of Statistics &amp; Programme Implementation (MoSPI) &middot; Government of India
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          Smart India Hackathon 2026 &middot; Team Lead Basina Surya Sashank (GCET)
        </div>
      </div>
    </motion.div>
  );
};
