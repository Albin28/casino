'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ============================
// SYMBOL DEFINITIONS
// ============================
export type Symbol = {
    emoji: string;
    name: string;
    weight: number;   // higher = more common
    payouts: { [match: number]: number }; // how many reels matched: multiplier
};

export const SYMBOLS: Symbol[] = [
    { emoji: '🍒', name: 'Cherry', weight: 35, payouts: { 2: 1.5, 3: 5 } },
    { emoji: '🍋', name: 'Lemon', weight: 30, payouts: { 2: 1.5, 3: 6 } },
    { emoji: '🍊', name: 'Orange', weight: 25, payouts: { 2: 2, 3: 8 } },
    { emoji: '🍇', name: 'Grape', weight: 20, payouts: { 2: 2.5, 3: 10 } },
    { emoji: '⭐', name: 'Star', weight: 15, payouts: { 2: 3, 3: 15 } },
    { emoji: '💎', name: 'Diamond', weight: 8, payouts: { 2: 5, 3: 30 } },
    { emoji: '7️⃣', name: 'Seven', weight: 3, payouts: { 2: 10, 3: 100 } },
];

// Build weighted pool
const SYMBOL_POOL: Symbol[] = [];
SYMBOLS.forEach(sym => {
    for (let i = 0; i < sym.weight; i++) SYMBOL_POOL.push(sym);
});

function pickRandom(): Symbol {
    return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
}

// Generate a strip of symbols for animation (result is the LAST element)
function generateStrip(result: Symbol, length = 24): Symbol[] {
    const strip: Symbol[] = [];
    for (let i = 0; i < length - 1; i++) strip.push(pickRandom());
    strip.push(result);
    return strip;
}

// ============================
// WIN EVALUATION
// ============================
export type SpinResult = {
    symbols: [Symbol, Symbol, Symbol];
    win: boolean;
    multiplier: number;
    label: string;
    isJackpot: boolean;
};

export function evaluateSpin(symbols: [Symbol, Symbol, Symbol]): SpinResult {
    const isJackpot = symbols.every(s => s.name === 'Seven');
    if (isJackpot) {
        return { symbols, win: true, multiplier: 100, label: '🎰 JACKPOT!', isJackpot: true };
    }
    // Count occurrences of each symbol
    const counts: Record<string, number> = {};
    symbols.forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1; });
    const maxCount = Math.max(...Object.values(counts));
    const topName = Object.keys(counts).find(k => counts[k] === maxCount)!;
    const topSym = SYMBOLS.find(s => s.name === topName)!;

    if (maxCount >= 2) {
        const multiplier = topSym.payouts[maxCount] || 0;
        const plural = topSym.name.toUpperCase() + (maxCount === 3 ? 'S' : 'S');
        const label = maxCount === 3
            ? `🎉 THREE ${plural}!`
            : `✨ TWO ${plural}`;
        return { symbols, win: true, multiplier, label, isJackpot: false };
    }
    return { symbols, win: false, multiplier: 0, label: 'No match — try again!', isJackpot: false };
}

// ============================
// REEL COMPONENT
// ============================
type ReelProps = {
    spinning: boolean;
    result: Symbol | null;
    delay: number;
    isWinner: boolean;
    isJackpot: boolean;
    onSettled: () => void;
};

function Reel({ spinning, result, delay, isWinner, isJackpot, onSettled }: ReelProps) {
    const [strip, setStrip] = useState<Symbol[]>([]);
    const [offset, setOffset] = useState(0);
    const [settled, setSettled] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const CELL_HEIGHT = 110;

    useEffect(() => {
        if (!spinning || !result) return;

        const newStrip = generateStrip(result, 24);
        setStrip(newStrip);
        setOffset(0);
        setSettled(false);

        let animId: number;
        const maxOffset = (newStrip.length - 1) * CELL_HEIGHT;

        const timeoutId = setTimeout(() => {
            startTimeRef.current = null;

            const animate = (ts: number) => {
                if (startTimeRef.current === null) startTimeRef.current = ts;
                const elapsed = ts - startTimeRef.current;
                const speed = Math.min(elapsed / 60, 16); // px per frame

                setOffset(prev => {
                    const next = prev + speed;
                    if (next >= maxOffset) {
                        // Snap to final position
                        return maxOffset;
                    }
                    animId = requestAnimationFrame(animate);
                    return next;
                });
            };

            animId = requestAnimationFrame(animate);
            rafRef.current = animId;
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            if (animId) cancelAnimationFrame(animId);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinning, result, delay]);

    // Fire onSettled when the reel reaches its final position
    useEffect(() => {
        if (!strip.length || !result) return;
        const maxOffset = (strip.length - 1) * CELL_HEIGHT;
        if (offset >= maxOffset && !settled && spinning) {
            setSettled(true);
            onSettled();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offset]);

    const stripRef = useRef<HTMLDivElement>(null);

    // Update CSS variable via ref to avoid inline style warnings
    useEffect(() => {
        if (stripRef.current) {
            stripRef.current.style.setProperty('--reel-offset', `${offset}px`);
        }
    }, [offset]);

    const displayStrip = strip.length > 0 ? strip : [pickRandom(), pickRandom(), pickRandom()];
    const windowClass = [
        'reel-window',
        isJackpot ? 'jackpot-reel' : isWinner ? 'winner' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={windowClass}>
            <div className="reel-strip" ref={stripRef}>
                {displayStrip.map((sym, i) => (
                    <div key={i} className="reel-cell">{sym.emoji}</div>
                ))}
            </div>
        </div>
    );
}

// ============================
// SLOT MACHINE MAIN
// ============================
type SlotMachineProps = {
    bet: number;
    onSpin: () => void;
    onResult: (result: SpinResult) => void;
    disabled: boolean;
};

export default function SlotMachine({ bet, onSpin, onResult, disabled }: SlotMachineProps) {
    const [spinning, setSpinning] = useState(false);
    const [results, setResults] = useState<[Symbol, Symbol, Symbol] | null>(null);
    const [evalResult, setEvalResult] = useState<SpinResult | null>(null);
    const settledCountRef = useRef(0);
    const pendingResultsRef = useRef<[Symbol, Symbol, Symbol] | null>(null);

    const handleSpin = () => {
        if (spinning || disabled) return;
        onSpin(); // deduct bet in parent
        const r1 = pickRandom(), r2 = pickRandom(), r3 = pickRandom();
        const newResults: [Symbol, Symbol, Symbol] = [r1, r2, r3];
        pendingResultsRef.current = newResults;
        settledCountRef.current = 0;
        setEvalResult(null);
        setSpinning(true);
        setResults(newResults);
    };

    const handleReelSettled = useCallback(() => {
        settledCountRef.current += 1;
        if (settledCountRef.current >= 3) {
            // All 3 reels have physically settled — now evaluate
            const resolvedResults = pendingResultsRef.current;
            if (resolvedResults) {
                const ev = evaluateSpin(resolvedResults);
                setSpinning(false);
                setEvalResult(ev);
                onResult(ev);
            }
        }
    }, [onResult]);

    const winnerIndexes: number[] = [];
    if (evalResult?.win && !evalResult.isJackpot && results) {
        const counts: Record<string, number[]> = {};
        results.forEach((s, i) => {
            if (!counts[s.name]) counts[s.name] = [];
            counts[s.name].push(i);
        });
        Object.values(counts).forEach(idxs => {
            if (idxs.length >= 2) idxs.forEach(i => winnerIndexes.push(i));
        });
    }

    return (
        <div className="slot-machine-wrap">
            {/* Reels */}
            <div
                className="reels-container"
                data-jackpot={evalResult?.isJackpot ? 'true' : 'false'}
            >
                {[0, 1, 2].map(i => (
                    <Reel
                        key={i}
                        spinning={spinning}
                        result={results?.[i] ?? null}
                        delay={i * 300}
                        isWinner={!evalResult?.isJackpot && winnerIndexes.includes(i)}
                        isJackpot={!!evalResult?.isJackpot}
                        onSettled={handleReelSettled}
                    />
                ))}
            </div>

            {/* Win / Loss Badge */}
            <div className="win-badge-area">
                {evalResult && !spinning && (
                    <div className={`win-badge ${evalResult.isJackpot ? 'jackpot' : evalResult.win ? (evalResult.multiplier >= 15 ? 'big-win' : 'small-win') : 'loss'}`}>
                        {evalResult.win
                            ? `${evalResult.label}  +${Math.round(bet * evalResult.multiplier)} chips`
                            : evalResult.label}
                    </div>
                )}
                {spinning && <div className="spinning-label">SPINNING...</div>}
            </div>

            {/* Spin Button */}
            <button
                className="btn-spin"
                onClick={handleSpin}
                disabled={spinning || disabled}
            >
                {spinning ? '⏳ Spinning' : '🎰 SPIN'}
            </button>
        </div>
    );
}
