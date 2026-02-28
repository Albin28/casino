'use client';
import { useEffect, useRef } from 'react';

type JackpotOverlayProps = {
    show: boolean;
    amount: number;
    onDismiss: () => void;
};

function makeConfetti(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const colors = ['#f5c842', '#e53935', '#00e676', '#b347ea', '#00e5ff', '#fff'];
    const particles = Array.from({ length: 160 }, () => ({
        x: Math.random() * W,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    let af: number;
    const draw = () => {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.rotV;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.y > H * 0.85 ? Math.max(0, 1 - (p.y - H * 0.85) / (H * 0.15)) : 1;
            if (p.shape === 'rect') {
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        });
        af = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(af);
}

export default function JackpotOverlay({ show, amount, onDismiss }: JackpotOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!show || !canvasRef.current) return;
        const stop = makeConfetti(canvasRef.current);
        return stop;
    }, [show]);

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer',
        }} onClick={onDismiss}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }} className="anim-scale-in">
                {/* Ring */}
                <div style={{
                    width: 200, height: 200, borderRadius: '50%',
                    border: '4px solid var(--accent-gold)',
                    boxShadow: 'var(--glow-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    background: 'radial-gradient(circle, rgba(245,200,66,0.15), rgba(179,71,234,0.1))',
                    animation: 'spin-ring 4s linear infinite',
                    position: 'relative',
                }}>
                    <div style={{ fontSize: '5rem', animation: 'float 1.5s ease-in-out infinite' }}>🎰</div>
                </div>

                <div style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                    fontWeight: 900,
                    color: 'var(--accent-gold)',
                    textShadow: 'var(--glow-gold)',
                    letterSpacing: '0.15em',
                    animation: 'jackpot-text 0.5s ease infinite',
                    lineHeight: 1.1,
                }}>
                    JACKPOT!
                </div>

                <div style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                    fontWeight: 700,
                    color: 'var(--accent-green)',
                    textShadow: 'var(--glow-green)',
                    marginTop: 12,
                }}>
                    +{amount.toLocaleString()} chips
                </div>

                <div style={{ fontSize: '2.5rem', marginTop: 8 }}>7️⃣ 7️⃣ 7️⃣</div>

                <div style={{
                    marginTop: 28,
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.1em',
                }}>
                    Tap anywhere to continue
                </div>
            </div>
        </div>
    );
}
