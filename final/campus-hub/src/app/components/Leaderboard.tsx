'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lucky_reels_leaderboard';
const NAME_KEY = 'lucky_reels_player_name';

export type LeaderEntry = {
    name: string;
    biggestWin: number;
    totalWon: number;
    spins: number;
    date: string;
};

export function useLeaderboard() {
    const [playerName, setPlayerName] = useState<string>('');
    const [board, setBoard] = useState<LeaderEntry[]>([]);
    const [namePromptOpen, setNamePromptOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(NAME_KEY);
        if (saved) setPlayerName(saved);
        else setNamePromptOpen(true);

        const savedBoard = localStorage.getItem(STORAGE_KEY);
        if (savedBoard) {
            try { setBoard(JSON.parse(savedBoard)); } catch { /* ignore */ }
        }
    }, []);

    const saveName = useCallback((name: string) => {
        const trimmed = name.trim() || 'Lucky Player';
        setPlayerName(trimmed);
        localStorage.setItem(NAME_KEY, trimmed);
        setNamePromptOpen(false);
    }, []);

    const recordWin = useCallback((amount: number, totalWon: number, spins: number) => {
        const name = localStorage.getItem(NAME_KEY) || 'Lucky Player';
        const existing = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } })() as LeaderEntry[];
        const myIndex = existing.findIndex(e => e.name === name);
        const entry: LeaderEntry = {
            name,
            biggestWin: Math.max(amount, myIndex >= 0 ? existing[myIndex].biggestWin : 0),
            totalWon,
            spins,
            date: new Date().toLocaleDateString(),
        };
        const updated = myIndex >= 0
            ? [...existing.slice(0, myIndex), entry, ...existing.slice(myIndex + 1)]
            : [...existing, entry];
        const sorted = updated.sort((a, b) => b.biggestWin - a.biggestWin).slice(0, 10);
        setBoard(sorted);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }, []);

    return { playerName, board, namePromptOpen, saveName, recordWin };
}

type LeaderboardProps = {
    board: LeaderEntry[];
    playerName: string;
};

export default function Leaderboard({ board, playerName }: LeaderboardProps) {
    const medals = ['🥇', '🥈', '🥉'];
    return (
        <div className="glass-card" style={{ padding: '16px', overflow: 'hidden' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 12 }}>
                🏆 LEADERBOARD
            </div>
            {board.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px 0' }}>
                    No wins recorded yet!
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {board.slice(0, 5).map((entry, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: entry.name === playerName ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.03)',
                            border: entry.name === playerName ? '1px solid rgba(245,200,66,0.25)' : '1px solid transparent',
                        }}>
                            <span style={{ fontSize: '1rem', width: 24 }}>{medals[i] || `${i + 1}.`}</span>
                            <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: entry.name === playerName ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                                {entry.name}
                            </span>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                                    {entry.biggestWin.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>best win</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

type NamePromptProps = {
    open: boolean;
    onSave: (name: string) => void;
};

export function NamePrompt({ open, onSave }: NamePromptProps) {
    const [value, setValue] = useState('');
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}>
            <div className="glass-card-gold" style={{ maxWidth: 380, width: '100%', padding: '36px 32px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎰</div>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.1em', marginBottom: 6 }}>
                    WELCOME!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Enter your name to track your wins on the leaderboard
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSave(value)}
                    placeholder="Your name..."
                    maxLength={18}
                    autoFocus
                    style={{
                        width: '100%', padding: '12px 16px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(245,200,66,0.3)',
                        borderRadius: 10, color: 'var(--text-primary)',
                        fontSize: '1rem', outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                        marginBottom: 16,
                        textAlign: 'center',
                    }}
                />
                <button className="btn-spin" style={{ width: '100%', borderRadius: 12 }} onClick={() => onSave(value)}>
                    Let&apos;s Play!
                </button>
            </div>
        </div>
    );
}
