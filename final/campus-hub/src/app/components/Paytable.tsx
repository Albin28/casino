'use client';
import { SYMBOLS } from './SlotMachine';

type PaytableProps = {
    onClose: () => void;
};

export default function Paytable({ onClose }: PaytableProps) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            animation: 'fadeInUp 0.3s ease',
        }} onClick={onClose}>
            <div
                className="glass-card-gold"
                style={{ maxWidth: 480, width: '100%', padding: '32px 28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-gold)', textShadow: 'var(--glow-gold)', letterSpacing: '0.12em' }}>
                        PAYTABLE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Match symbols to win chips</div>
                </div>

                {/* Symbol rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...SYMBOLS].reverse().map(sym => (
                        <div key={sym.name} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <span style={{ fontSize: '2rem', width: 44, textAlign: 'center' }}>{sym.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{sym.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Rarity: {sym.weight <= 3 ? '⚡ Ultra Rare' : sym.weight <= 8 ? '💜 Rare' : sym.weight <= 15 ? '🔵 Uncommon' : '⚪ Common'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>
                                    2× → <strong>{sym.payouts[2]}x</strong>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)' }}>
                                    3× → <strong>{sym.payouts[3]}x</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Jackpot callout */}
                <div style={{
                    marginTop: 16,
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, rgba(179,71,234,0.15), rgba(245,200,66,0.08))',
                    border: '1px solid rgba(245,200,66,0.5)',
                    borderRadius: 12,
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>7️⃣ 7️⃣ 7️⃣</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--accent-gold)', fontWeight: 900, letterSpacing: '0.1em', fontSize: '1rem' }}>
                        JACKPOT — 100× BET!
                    </div>
                </div>

                <button className="btn-secondary" onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '12px' }}>
                    Close
                </button>
            </div>
        </div>
    );
}
