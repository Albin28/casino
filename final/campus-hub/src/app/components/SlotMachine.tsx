'use client';
import { useState, useRef, useEffect } from 'react';

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

// Generate a strip of symbols for animation
function generateStrip(result: Symbol, length = 20): Symbol[] {
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
    // Count matches of the first symbol
    const counts: Record<string, number> = {};
    symbols.forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1; });
    const maxCount = Math.max(...Object.values(counts));
    const topName = Object.keys(counts).find(k => counts[k] === maxCount)!;
    const topSym = SYMBOLS.find(s => s.name === topName)!;

    if (maxCount >= 2) {
        const multiplier = topSym.payouts[maxCount] || 0;
        const label = maxCount === 3
            ? `🎉 THREE ${topSym.name.toUpperCase()}S!`
            : `✨ TWO ${topSym.name.toUpperCase()}S`;
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
};

function Reel({ spinning, result, delay, isWinner, isJackpot }: ReelProps) {
    const [strip, setStrip] = useState<Symbol[]>([]);
    const [offset, setOffset] = useState(0);
    const [settled, setSettled] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const speedRef = useRef(0);
    const CELL_HEIGHT = 110;

    useEffect(() => {
        if (spinning && result) {
            const newStrip = generateStrip(result, 22);
            setStrip(newStrip);
            setOffset(0);
            setSettled(false);
            speedRef.current = 0;

            const timeoutId = setTimeout(() => {
                startTimeRef.current = null;
                const animate = (ts: number) => {
                    if (startTimeRef.current === null) startTimeRef.current = ts;
                    const elapsed = ts - startTimeRef.current;
                    // Ramp speed up then hold
                    speedRef.current = Math.min(elapsed / 80, 14);
                    setOffset(prev => {
                        const next = prev + speedRef.current;
                        const maxOffset = (newStrip.length - 1) * CELL_HEIGHT;
                        if (next >= maxOffset) {
                            setSettled(true);
                            return maxOffset;
                        }
                        return next;
                    });
                    rafRef.current = requestAnimationFrame(animate);
                };
                rafRef.current = requestAnimationFrame(animate);
            }, delay);

            return () => {
                clearTimeout(timeoutId);
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinning, result]);

    useEffect(() => {
        if (settled && rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
    }, [settled]);

    const displayStrip = strip.length > 0 ? strip : [pickRandom(), pickRandom(), pickRandom()];
    const windowClass = [
        'reel-window',
        isJackpot ? 'jackpot-reel' : isWinner ? 'winner' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={windowClass}>
            <div
                className="reel-strip"
                style={{ transform: `translateY(-${offset}px)` }}
            >
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

    const handleSpin = () => {
        if (spinning || disabled) return;
        onSpin(); // deduct bet in parent
        const r1 = pickRandom(), r2 = pickRandom(), r3 = pickRandom();
        const newResults: [Symbol, Symbol, Symbol] = [r1, r2, r3];
        setEvalResult(null);
        setSpinning(true);
        setResults(newResults);

        // Evaluate after all reels settle (~2.2s for last reel)
        setTimeout(() => {
            setSpinning(false);
            const ev = evaluateSpin(newResults);
            setEvalResult(ev);
            onResult(ev);
        }, 2400);
    };

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
                        delay={i * 250}
                        isWinner={!evalResult?.isJackpot && winnerIndexes.includes(i)}
                        isJackpot={!!evalResult?.isJackpot}
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
