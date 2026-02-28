'use client';
import type { SpinResult } from './SlotMachine';

type HistoryEntry = {
    id: number;
    symbols: string;
    bet: number;
    change: number;
    label: string;
    isJackpot: boolean;
};

type HistoryProps = {
    entries: HistoryEntry[];
};

export type { HistoryEntry };

export default function History({ entries }: HistoryProps) {
    return (
        <div className="glass-card" style={{ padding: '16px', overflow: 'hidden' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 12 }}>
                SPIN HISTORY
            </div>
            {entries.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>
                    No spins yet — hit SPIN!
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                    {entries.map((entry, i) => (
                        <div key={entry.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px',
                            borderRadius: 8,
                            background: entry.isJackpot
                                ? 'linear-gradient(90deg, rgba(245,200,66,0.12), rgba(179,71,234,0.08))'
                                : entry.change > 0
                                    ? 'rgba(0,230,118,0.06)'
                                    : 'rgba(255,255,255,0.03)',
                            border: entry.isJackpot
                                ? '1px solid rgba(245,200,66,0.3)'
                                : '1px solid transparent',
                            animation: i === 0 ? 'fadeInDown 0.3s ease' : 'none',
                        }}>
                            <span style={{ fontSize: '1.1rem', letterSpacing: 2 }}>{entry.symbols}</span>
                            <div style={{ flex: 1, fontSize: '0.67rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.label}
                            </div>
                            <div style={{
                                fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem', fontWeight: 700,
                                color: entry.change > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                                flexShrink: 0,
                            }}>
                                {entry.change > 0 ? `+${entry.change}` : `-${entry.bet}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function buildHistoryEntry(result: SpinResult, bet: number, id: number): HistoryEntry {
    return {
        id,
        symbols: result.symbols.map(s => s.emoji).join(' '),
        bet,
        change: result.win ? Math.round(bet * result.multiplier) : 0,
        label: result.label,
        isJackpot: result.isJackpot,
    };
}
